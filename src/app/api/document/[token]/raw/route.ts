import { NextRequest, NextResponse } from "next/server";
import { db, documents } from "@/db";
import { hashAccessToken } from "@/lib/security/token";
import { getPdfBufferFromR2 } from "@/lib/storage/r2";
import { checkRateLimit, getClientIpHash } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/security/audit";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || typeof token !== "string") {
      return new NextResponse("Invalid document token", { status: 400 });
    }

    const ipHash = getClientIpHash(request.headers);
    const rateLimit = checkRateLimit(`view-raw:${ipHash}`, 40, 60 * 1000);
    if (!rateLimit.allowed) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    const tokenHash = hashAccessToken(token);

    const docRecords = await db
      .select()
      .from(documents)
      .where(eq(documents.tokenHash, tokenHash))
      .limit(1);

    const doc = docRecords[0];

    if (!doc) {
      return new NextResponse("Document not found", { status: 404 });
    }

    if (doc.status !== "ACTIVE") {
      return new NextResponse(`Document is unavailable (Status: ${doc.status})`, {
        status: 410,
      });
    }

    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
      await db.update(documents).set({ status: "EXPIRED" }).where(eq(documents.id, doc.id));
      return new NextResponse("Document has expired", { status: 410 });
    }

    // Retrieve private PDF buffer from Cloudflare R2
    const pdfBuffer = await getPdfBufferFromR2(doc.storageKey);

    await logAuditEvent({
      documentId: doc.id,
      action: "DOCUMENT_VIEWED",
      requestHeaders: request.headers,
      details: {
        fileName: doc.fileName,
        size: pdfBuffer.length,
      },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="secure-document.pdf"',
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("[Get Raw PDF Stream Error]:", error);
    return new NextResponse("Failed to load secure document stream.", { status: 500 });
  }
}
