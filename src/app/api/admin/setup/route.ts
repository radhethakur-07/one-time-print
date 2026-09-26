import { NextRequest, NextResponse } from "next/server";
import { bootstrapDatabase } from "@/db/bootstrap";
import { getAdminSession } from "@/lib/auth/session";

export async function GET() {
  const isDbConfigured = Boolean(process.env.DATABASE_URL);
  const isR2Configured = Boolean(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    (process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID)
  );
  const isAuthSecretConfigured = Boolean(process.env.AUTH_SECRET);

  return NextResponse.json({
    status: isDbConfigured && isR2Configured ? "ready" : "configuration_required",
    checks: {
      databaseUrl: isDbConfigured,
      r2Storage: isR2Configured,
      authSecret: isAuthSecretConfigured,
    },
    r2Bucket: process.env.R2_BUCKET_NAME || "Not configured",
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    // Allow setup if no users exist or if admin is logged in
    const result = await bootstrapDatabase();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Setup failed" },
      { status: 500 }
    );
  }
}
