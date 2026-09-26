import { NextRequest, NextResponse } from "next/server";
import { db, documents } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { deletePdfFromR2 } from "@/lib/storage/r2";
import { logAuditEvent } from "@/lib/security/audit";
import { eq } from "drizzle-orm";

export async function DELETE(
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

    // Delete object from Cloudflare R2 bucket
    if (document.storageKey) {
      await deletePdfFromR2(document.storageKey);
    }

    // Update document status to DELETED and set deletedAt or delete from DB
    await db
      .update(documents)
      .set({
        status: "DELETED",
        deletedAt: new Date(),
      })
      .where(eq(documents.id, id));

    await logAuditEvent({
      documentId: id,
      action: "DOCUMENT_DELETED",
      requestHeaders: request.headers,
      details: {
        adminId: session.userId,
        fileName: document.fileName,
        storageKey: document.storageKey,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document and storage object deleted successfully.",
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    console.error("[Delete Document Error]:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
