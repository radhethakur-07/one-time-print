import { NextRequest, NextResponse } from "next/server";
import { db, documents } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/security/audit";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
    }

    const docRecords = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    const document = docRecords[0];

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.status === "REVOKED") {
      return NextResponse.json({ message: "Document is already revoked" });
    }

    if (document.status === "PRINTED") {
      return NextResponse.json(
        { error: "Document has already been printed. Token is already permanently invalid." },
        { status: 400 }
      );
    }

    await db
      .update(documents)
      .set({
        status: "REVOKED",
        revokedAt: new Date(),
      })
      .where(eq(documents.id, id));

    await logAuditEvent({
      documentId: id,
      action: "DOCUMENT_REVOKED",
      requestHeaders: request.headers,
      details: {
        adminId: session.userId,
        fileName: document.fileName,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document access token has been revoked.",
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    console.error("[Revoke Document Error]:", error);
    return NextResponse.json({ error: "Failed to revoke document token" }, { status: 500 });
  }
}
