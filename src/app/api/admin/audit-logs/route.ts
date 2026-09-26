import { NextRequest, NextResponse } from "next/server";
import { db, auditLogs } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { desc, sql, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const whereClause = documentId ? eq(auditLogs.documentId, documentId) : undefined;

    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);

    return NextResponse.json({ logs });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    console.error("[Get Audit Logs Error]:", error);
    return NextResponse.json({ error: "Failed to retrieve audit logs" }, { status: 500 });
  }
}
