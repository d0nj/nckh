import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { certificates, user, programs } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const [cert] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, id))
      .limit(1);

    if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

    // IDOR fix: students can only view their own certificates
    if (session.user.role === "student" && cert.studentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(cert);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Mass assignment fix: only allow explicit fields
    const updateData: Record<string, unknown> = {};
    if (body.certificateNumber !== undefined) updateData.certificateNumber = body.certificateNumber;
    if (body.issueDate !== undefined) updateData.issueDate = body.issueDate;
    if (body.status !== undefined) updateData.status = body.status;

    // Preserve existing status-transition logic
    if (body.status === "approved") {
      updateData.approvedBy = session.user.id;
      updateData.approvedAt = new Date().toISOString();
    } else if (body.status === "issued") {
      updateData.issuedBy = session.user.id;
      updateData.issuedAt = new Date().toISOString();
    } else if (body.status === "revoked") {
      if (!body.revokedReason) {
        return NextResponse.json({ error: "Revoked reason is required" }, { status: 400 });
      }
      updateData.revokedReason = body.revokedReason;
    }

    const updated = await db
      .update(certificates)
      .set(updateData)
      .where(eq(certificates.id, id))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const [deleted] = await db.delete(certificates).where(eq(certificates.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
