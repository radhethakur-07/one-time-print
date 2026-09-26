import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { setAdminSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";
import { checkRateLimit, getClientIpHash } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/security/audit";
import { ensureDatabaseReady } from "@/db/bootstrap";

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseReady();

    // Rate limiting: max 5 login attempts per 15 minutes per IP
    const ipHash = getClientIpHash(request.headers);
    const rateLimit = checkRateLimit(`login:${ipHash}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many authentication attempts. Please try again later.",
          resetInMs: rateLimit.resetInMs,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // Look up user by email
    const userRecords = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    const user = userRecords[0];

    if (!user) {
      await logAuditEvent({
        action: "ADMIN_LOGIN_FAILED",
        requestHeaders: request.headers,
        details: { email, reason: "User not found" },
      });
      return NextResponse.json(
        { error: "Invalid credentials provided." },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await logAuditEvent({
        action: "ADMIN_LOGIN_FAILED",
        requestHeaders: request.headers,
        details: { email, reason: "Invalid password" },
      });
      return NextResponse.json(
        { error: "Invalid credentials provided." },
        { status: 401 }
      );
    }

    // Set secure HTTP-only session cookie
    await setAdminSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await logAuditEvent({
      action: "ADMIN_LOGIN_SUCCESS",
      requestHeaders: request.headers,
      details: { userId: user.id, email: user.email },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[Login Route Error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}
