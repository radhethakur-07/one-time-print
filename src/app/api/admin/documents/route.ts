import { NextRequest, NextResponse } from "next/server";
import { db, documents, users } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { generateAccessToken, hashAccessToken, buildDocumentUrl } from "@/lib/security/token";
import { validatePdfMagicBytes, sanitizeFileName, getMaxUploadSizeBytes } from "@/lib/security/magic-bytes";
import { uploadPdfToR2 } from "@/lib/storage/r2";
import { checkRateLimit, getClientIpHash } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/security/audit";
import { calculateExpirationDate } from "@/lib/utils";
import { desc, eq, like, and, or, sql } from "drizzle-orm";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "ALL";
    const searchQuery = searchParams.get("query")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (statusFilter !== "ALL") {
      conditions.push(eq(documents.status, statusFilter as any));
    }

    if (searchQuery) {
      conditions.push(like(documents.fileName, `%${searchQuery}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [docsList, totalCountResult] = await Promise.all([
      db
        .select({
          id: documents.id,
          fileName: documents.fileName,
          status: documents.status,
          fileSize: documents.fileSize,
          mimeType: documents.mimeType,
          pageCount: documents.pageCount,
          createdAt: documents.createdAt,
          expiresAt: documents.expiresAt,
          printedAt: documents.printedAt,
          revokedAt: documents.revokedAt,
          deletedAt: documents.deletedAt,
        })
        .from(documents)
        .where(whereClause)
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(whereClause),
    ]);

    const total = Number(totalCountResult[0]?.count || 0);

    return NextResponse.json({
      documents: docsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    console.error("[Get Documents Error]:", error);
    return NextResponse.json({ error: "Failed to retrieve documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    // Rate limiting: max 30 uploads / 10 min per admin
    const ipHash = getClientIpHash(request.headers);
    const rateLimit = checkRateLimit(`upload:${session.userId}:${ipHash}`, 30, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Upload rate limit exceeded. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const expirationOption = (formData.get("expirationOption") as any) || "24hours";
    const customExpiresAt = formData.get("customExpiresAt") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided in the request." }, { status: 400 });
    }

    // Check size limit
    const maxSizeBytes = getMaxUploadSizeBytes();
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          error: `File size exceeds the configured limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`,
        },
        { status: 413 }
      );
    }

    // Convert file to arrayBuffer and inspect magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const magicCheck = validatePdfMagicBytes(fileBuffer);
    if (!magicCheck.valid) {
      return NextResponse.json(
        { error: magicCheck.reason || "The uploaded file is not a valid PDF document." },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeFileName(file.name);
    const documentId = "doc_" + crypto.randomBytes(12).toString("hex");
    const rawAccessToken = generateAccessToken();
    const tokenHash = hashAccessToken(rawAccessToken);
    const storageKey = `documents/${documentId}/${crypto.randomUUID()}.pdf`;

    const expiresAt = calculateExpirationDate(expirationOption, customExpiresAt);

    // Upload to Cloudflare R2 privately
    await uploadPdfToR2(storageKey, fileBuffer, "application/pdf");

    // Insert record in Neon PostgreSQL
    await db.insert(documents).values({
      id: documentId,
      fileName: sanitizedName,
      storageKey,
      tokenHash,
      status: "ACTIVE",
      fileSize: fileBuffer.length,
      mimeType: "application/pdf",
      pageCount: 1, // Will be parsed client-side by PDF.js
      createdAt: new Date(),
      expiresAt,
      createdBy: session.userId,
    });

    await logAuditEvent({
      documentId,
      action: "DOCUMENT_UPLOADED",
      requestHeaders: request.headers,
      details: {
        fileName: sanitizedName,
        fileSize: fileBuffer.length,
        expiresAt: expiresAt?.toISOString() || "never",
        adminId: session.userId,
      },
    });

    const oneTimeUrl = buildDocumentUrl(rawAccessToken);

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        fileName: sanitizedName,
        fileSize: fileBuffer.length,
        status: "ACTIVE",
        expiresAt,
        oneTimeUrl,
        rawToken: rawAccessToken,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    console.error("[Upload Document Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process and store PDF document." },
      { status: 500 }
    );
  }
}
