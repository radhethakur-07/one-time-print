import { NextRequest, NextResponse } from "next/server";
import { db, documents } from "@/db";
import { hashAccessToken } from "@/lib/security/token";
import { checkRateLimit, getClientIpHash } from "@/lib/security/rate-limit";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || typeof token !== "string" || token.length < 16) {
      return NextResponse.json({ error: "Invalid document token format" }, { status: 400 });
    }

    const ipHash = getClientIpHash(request.headers);
    const rateLimit = checkRateLimit(`view-meta:${ipHash}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const tokenHash = hashAccessToken(token);

    const docRecords = await db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        status: documents.status,
        fileSize: documents.fileSize,
        pageCount: documents.pageCount,
        createdAt: documents.createdAt,
        expiresAt: documents.expiresAt,
        printedAt: documents.printedAt,
        revokedAt: documents.revokedAt,
      })
      .from(documents)
      .where(eq(documents.tokenHash, tokenHash))
      .limit(1);

    const doc = docRecords[0];

    if (!doc) {
      return NextResponse.json(
        {
          error: "Document not found or access link is invalid.",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Check if expired
    if (doc.status === "ACTIVE" && doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
      await db.update(documents).set({ status: "EXPIRED" }).where(eq(documents.id, doc.id));
      return NextResponse.json(
        {
          error: "This document access link has expired.",
          code: "EXPIRED",
          status: "EXPIRED",
          expiresAt: doc.expiresAt,
        },
        { status: 410 }
      );
    }

    if (doc.status === "PRINTED" || doc.status === "PRINTING") {
      return NextResponse.json(
        {
          error: "This one-time document has already been printed and is no longer accessible.",
          code: "ALREADY_PRINTED",
          status: doc.status,
          printedAt: doc.printedAt,
        },
        { status: 410 }
      );
    }

    if (doc.status === "REVOKED") {
      return NextResponse.json(
        {
          error: "Access to this document has been revoked by the administrator.",
          code: "REVOKED",
          status: "REVOKED",
        },
        { status: 410 }
      );
    }

    if (doc.status === "DELETED") {
      return NextResponse.json(
        {
          error: "This document has been deleted and is no longer available.",
          code: "DELETED",
          status: "DELETED",
        },
        { status: 404 }
      );
    }

    // Active document
    return NextResponse.json({
      status: "ACTIVE",
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      pageCount: doc.pageCount,
      expiresAt: doc.expiresAt,
    });
  } catch (error: any) {
    console.error("[Get Document Metadata Error]:", error);
    return NextResponse.json(
      { error: "Failed to verify document access token." },
      { status: 500 }
    );
  }
}
