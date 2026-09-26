import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { db, documentPayloads } from "@/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    (process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID)
  );
}

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "Cloudflare R2 storage credentials missing."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function getBucketName(): string {
  return process.env.R2_BUCKET_NAME || "onetimeprint-vault";
}

/**
 * Uploads a validated PDF binary buffer either to Cloudflare R2 or securely to Neon Database.
 */
export async function uploadPdfToR2(
  storageKey: string,
  buffer: Buffer | Uint8Array,
  contentType: string = "application/pdf"
): Promise<{ storageKey: string; size: number }> {
  if (isR2Configured()) {
    const client = getR2Client();
    const bucketName = getBucketName();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
      ACL: "private",
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(command);

    return {
      storageKey,
      size: buffer.length,
    };
  } else {
    // Zero-Card Mode: Store directly into Neon PostgreSQL securely
    const base64Data = Buffer.from(buffer).toString("base64");
    const payloadId = "pl_" + crypto.randomBytes(12).toString("hex");

    await db.insert(documentPayloads).values({
      id: payloadId,
      storageKey,
      payloadBase64: base64Data,
      createdAt: new Date(),
    });

    return {
      storageKey,
      size: buffer.length,
    };
  }
}

/**
 * Retrieves the raw PDF binary securely from Cloudflare R2 or Neon Database.
 */
export async function getPdfBufferFromR2(storageKey: string): Promise<Buffer> {
  if (isR2Configured()) {
    const client = getR2Client();
    const bucketName = getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    });

    const response = await client.send(command);
    if (!response.Body) {
      throw new Error("Storage object body is empty or not found.");
    }

    const streamToBuffer = async (stream: any): Promise<Buffer> => {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      return Buffer.concat(chunks);
    };

    return streamToBuffer(response.Body);
  } else {
    // Retrieve from Neon DB payload
    const payloadRecord = await db
      .select()
      .from(documentPayloads)
      .where(eq(documentPayloads.storageKey, storageKey))
      .limit(1);

    if (!payloadRecord[0] || !payloadRecord[0].payloadBase64) {
      throw new Error("Document binary payload not found in storage repository.");
    }

    return Buffer.from(payloadRecord[0].payloadBase64, "base64");
  }
}

/**
 * Permanently deletes a PDF object from Cloudflare R2 or Neon Database.
 */
export async function deletePdfFromR2(storageKey: string): Promise<boolean> {
  try {
    if (isR2Configured()) {
      const client = getR2Client();
      const bucketName = getBucketName();

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      });

      await client.send(command);
    } else {
      await db.delete(documentPayloads).where(eq(documentPayloads.storageKey, storageKey));
    }
    return true;
  } catch (error) {
    console.error(`[Storage Deletion Failed for key ${storageKey}]:`, error);
    return false;
  }
}
