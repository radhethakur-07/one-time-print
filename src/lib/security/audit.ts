import { db, auditLogs } from "@/db";
import { getClientIpHash, getSanitizedUserAgent } from "./rate-limit";
import crypto from "crypto";

export interface LogAuditEventParams {
  documentId?: string | null;
  action: string;
  requestHeaders?: Headers | null;
  details?: Record<string, unknown> | string;
}

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    const ipHash = params.requestHeaders ? getClientIpHash(params.requestHeaders) : null;
    const userAgent = params.requestHeaders ? getSanitizedUserAgent(params.requestHeaders) : null;
    const detailsString =
      typeof params.details === "object" ? JSON.stringify(params.details) : params.details || null;

    const logId = "log_" + crypto.randomBytes(12).toString("hex");

    await db.insert(auditLogs).values({
      id: logId,
      documentId: params.documentId || null,
      action: params.action,
      ipHash,
      userAgentSummary: userAgent,
      details: detailsString,
      timestamp: new Date(),
    });
  } catch (error) {
    // Non-blocking catch to prevent audit failure from crashing user transactions
    console.error("[Audit Log Error]:", error);
  }
}
