import { NextRequest, NextResponse } from "next/server";
import { db, documents } from "@/db";
import { hashAccessToken } from "@/lib/security/token";
import { checkRateLimit, getClientIpHash } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/security/audit";
import { sql, eq, and, or, isNull, gt } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid document token format." }, { status: 400 });
    }

    const ipHash = getClientIpHash(request.headers);
    const rateLimit = checkRateLimit(`print:${ipHash}`, 15, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many print requests. Please wait." },
        { status: 429 }
      );
    }

    const tokenHash = hashAccessToken(token);

    // ATOMIC DATABASE UPDATE TO PREVENT RACE CONDITIONS
    // Only transitions if status is currently ACTIVE and expires_at is in the future (or null)
    const now = new Date();
    const updatedDocs = await db
      .update(documents)
      .set({
        status: "PRINTING",
      })
      .where(
        and(
          eq(documents.tokenHash, tokenHash),
          eq(documents.status, "ACTIVE"),
          or(isNull(documents.expiresAt), gt(documents.expiresAt, now))
        )
      )
      .returning({
        id: documents.id,
        fileName: documents.fileName,
      });

    // If exactly 0 rows were updated, a race condition occurred or token is already consumed/expired/revoked
    if (updatedDocs.length === 0) {
      // Check current state to provide clear explanation
      const existing = await db
        .select({ status: documents.status, printedAt: documents.printedAt })
        .from(documents)
        .where(eq(documents.tokenHash, tokenHash))
        .limit(1);

      const status = existing[0]?.status || "INVALID";

      return NextResponse.json(
        {
          error:
            status === "PRINTED" || status === "PRINTING"
              ? "This document has already been printed. The access link is no longer valid."
              : status === "EXPIRED"
              ? "This document access link has expired."
              : status === "REVOKED"
              ? "This document access link was revoked by the administrator."
              : "Document not found or cannot be printed.",
          status,
          code: "PRINT_DENIED",
        },
        { status: 410 }
      );
    }

    const doc = updatedDocs[0];

    // Finalize state to PRINTED and record timestamp
    await db
      .update(documents)
      .set({
        status: "PRINTED",
        printedAt: new Date(),
      })
      .where(eq(documents.id, doc.id));

    // Audit log
    await logAuditEvent({
      documentId: doc.id,
      action: "DOCUMENT_PRINTED",
      requestHeaders: request.headers,
      details: {
        fileName: doc.fileName,
        consumedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      status: "PRINTED",
      message: "One-time print authorization granted. Link has now been permanently invalidated.",
    });
  } catch (error: any) {
    console.error("[Print Initiation Error]:", error);
    return NextResponse.json(
      { error: "Failed to process print authorization." },
      { status: 500 }
    );
  }
}
