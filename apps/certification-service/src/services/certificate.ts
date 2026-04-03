import { eq, and, desc } from "drizzle-orm";
import type { Database } from "@thai-binh/database/pg";
import { schema } from "@thai-binh/database/pg";
import type { IssueCertificateInput } from "../validation/schemas";

export class CertificateService {
  constructor(private db: Database) {}

  async getCertificates(
    organizationId: string,
    options: { status?: string; page: number; limit: number }
  ) {
    const offset = (options.page - 1) * options.limit;

    const query = this.db.query.certificates.findMany({
      where: (certs, { eq, and }) => {
        const conditions = [eq(certs.organizationId, organizationId)];
        if (options.status) {
          conditions.push(eq(certs.status, options.status));
        }
        return and(...conditions);
      },
      with: {
        registryEntry: true,
      },
      orderBy: (certs, { desc }) => [desc(certs.createdAt)],
      limit: options.limit,
      offset,
    });

    return await query;
  }

  async getCertificateById(id: string, organizationId: string) {
    return await this.db.query.certificates.findFirst({
      where: (certs, { eq, and }) =>
        and(eq(certs.id, id), eq(certs.organizationId, organizationId)),
      with: {
        registryEntry: true,
        workflowSteps: true,
      },
    });
  }

  async issueCertificate(
    data: IssueCertificateInput,
    organizationId: string,
    issuedBy: string
  ) {
    // Step 1: Pre-check
    const preCheck = await this.db.query.preCheckRecords.findFirst({
      where: (checks, { eq, and }) =>
        and(
          eq(checks.studentId, data.studentId),
          eq(checks.courseId, data.courseId),
          eq(checks.organizationId, organizationId),
          eq(checks.eligibleForCertificate, true)
        ),
    });

    if (!preCheck) {
      throw new Error("Student not eligible for certificate");
    }

    // Step 2: Find available blank
    const blank = await this.db.query.certificateBlanks.findFirst({
      where: (blanks, { eq, and }) =>
        and(
          eq(blanks.organizationId, organizationId),
          eq(blanks.status, "in_stock")
        ),
    });

    if (!blank) {
      throw new Error("No certificate blanks available");
    }

    // Step 3: Find open registry book
    const book = await this.db.query.registryBooks.findFirst({
      where: (books, { eq, and }) =>
        and(
          eq(books.organizationId, organizationId),
          eq(books.isClosed, false)
        ),
    });

    if (!book) {
      throw new Error("No open registry book found");
    }

    // Step 4: Generate entry number
    const lastEntry = await this.db.query.registryBookEntries.findFirst({
      where: (entries, { eq }) => eq(entries.registryBookId, book.id),
      orderBy: (entries, { desc }) => [desc(entries.entryNumber)],
    });

    const entryNumber = lastEntry
      ? (parseInt(lastEntry.entryNumber) + 1).toString().padStart(4, "0")
      : "0001";

    // Execute in transaction
    const result = await this.db.transaction(async (tx) => {
      // Create registry entry
      const [entry] = await tx
        .insert(schema.registryBookEntries)
        .values({
          organizationId,
          registryBookId: book.id,
          entryNumber,
          studentId: data.studentId,
          fullName: preCheck.studentId,
          dateOfBirth: new Date(),
          gender: "male",
          courseId: data.courseId,
          courseName: "",
          decisionNumber: data.decisionNumber,
          decisionDate: new Date(data.decisionDate),
          classification: data.classification,
          certificateSerialNumber: blank.serialNumber,
          version: 1,
          isLatest: true,
        })
        .returning();

      // Update blank status
      await tx
        .update(schema.certificateBlanks)
        .set({
          status: "used",
          usedForCertificateId: entry.id,
          usedAt: new Date(),
        })
        .where(eq(schema.certificateBlanks.id, blank.id));

      // Create certificate
      const [certificate] = await tx
        .insert(schema.certificates)
        .values({
          organizationId,
          registryEntryId: entry.id,
          studentId: data.studentId,
          courseId: data.courseId,
          certificateSerialNumber: blank.serialNumber,
          certificateType: data.certificateType,
          status: "draft",
          issuedBy,
        })
        .returning();

      // Create workflow steps
      await tx.insert(schema.certificateWorkflowSteps).values([
        {
          certificateId: certificate.id,
          organizationId,
          step: "pre_check",
          status: "completed",
          performedBy: issuedBy,
          performedAt: new Date(),
        },
        {
          certificateId: certificate.id,
          organizationId,
          step: "assign_serial",
          status: "completed",
          performedBy: issuedBy,
          performedAt: new Date(),
        },
        {
          certificateId: certificate.id,
          organizationId,
          step: "draft",
          status: "completed",
          performedBy: issuedBy,
          performedAt: new Date(),
        },
        {
          certificateId: certificate.id,
          organizationId,
          step: "approve",
          status: "pending",
        },
        {
          certificateId: certificate.id,
          organizationId,
          step: "sign",
          status: "pending",
        },
        {
          certificateId: certificate.id,
          organizationId,
          step: "issue",
          status: "pending",
        },
      ]);

      return { certificate, entry, blank };
    });

    return result;
  }

  async updateCertificateStatus(
    id: string,
    organizationId: string,
    status: string,
    userId: string
  ) {
    const [certificate] = await this.db
      .update(schema.certificates)
      .set({ status })
      .where(
        and(
          eq(schema.certificates.id, id),
          eq(schema.certificates.organizationId, organizationId)
        )
      )
      .returning();

    return certificate;
  }
}
