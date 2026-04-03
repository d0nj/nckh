import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createDatabase } from "@thai-binh/database/pg";
import { success, error, notFoundError } from "@thai-binh/utils/response";
import { CertificateService } from "../services/certificate";
import { issueCertificateSchema } from "../validation/schemas";
import type { Context } from "hono";

const app = new Hono();

// Helper to get organization ID from headers
function getOrganizationId(c: Context): string {
  return c.req.header("X-Organization-Id") || "default";
}

// Helper to get user ID from headers
function getUserId(c: Context): string {
  return c.req.header("X-User-Id") || "system";
}

// Get all certificates
app.get("/", async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const service = new CertificateService(db);
  const organizationId = getOrganizationId(c);

  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const status = c.req.query("status");

  const certificates = await service.getCertificates(organizationId, {
    status: status || undefined,
    page,
    limit,
  });

  return c.json(success(certificates, { page, limit }));
});

// Get certificate by ID
app.get("/:id", async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const service = new CertificateService(db);
  const id = c.req.param("id");
  const organizationId = getOrganizationId(c);

  const certificate = await service.getCertificateById(id, organizationId);

  if (!certificate) {
    return c.json(notFoundError("Certificate", id), 404);
  }

  return c.json(success(certificate));
});

// Issue certificate
app.post("/", zValidator("json", issueCertificateSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const service = new CertificateService(db);
  const data = c.req.valid("json");
  const organizationId = getOrganizationId(c);
  const issuedBy = getUserId(c);

  try {
    const result = await service.issueCertificate(
      data,
      organizationId,
      issuedBy
    );

    return c.json(
      success(result, undefined, "Certificate issued successfully"),
      201
    );
  } catch (err) {
    return c.json(
      error("ISSUANCE_FAILED", err instanceof Error ? err.message : "Unknown error"),
      400
    );
  }
});

// Approve certificate
app.post("/:id/approve", async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const service = new CertificateService(db);
  const id = c.req.param("id");
  const organizationId = getOrganizationId(c);

  const certificate = await service.updateCertificateStatus(
    id,
    organizationId,
    "approved",
    getUserId(c)
  );

  if (!certificate) {
    return c.json(notFoundError("Certificate", id), 404);
  }

  return c.json(success(certificate, undefined, "Certificate approved"));
});

export { app as certificateRoutes };
