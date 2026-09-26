import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { setAdminSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";
import { checkRateLimit, getClientIpHash } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/security/audit";
import { bootstrapDatabase } from "@/db/bootstrap";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Proactively verify / initialize schema
    await bootstrapDatabase();

    // Rate limiting: max 15 login attempts per 15 minutes per IP
    const ipHash = getClientIpHash(request.headers);
    const rateLimit = checkRateLimit(`login:${ipHash}`, 15, 15 * 60 * 1000);
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
        { error: "Please enter a valid email address and password." },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Look up user by email (with self-healing retry if table was just created)
    let userRecords: any[] = [];
    try {
      userRecords = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
    } catch (queryErr: any) {
      console.warn("[Initial User Query Notice]:", queryErr?.message);
      await bootstrapDatabase();
      userRecords = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
    }

    let user = userRecords[0];

    // Check environment admin credentials
    const envAdminEmail = (process.env.ADMIN_EMAIL || "admin@onetimeprint.internal").toLowerCase().trim();
    const envDefaultPass = process.env.ADMIN_DEFAULT_PASSWORD;

    // If user not in DB yet (e.g. first login)
    if (!user && (normalizedEmail === envAdminEmail || (await db.select().from(users).limit(1)).length === 0)) {
      const passwordHash = await hashPassword(envDefaultPass || password);
      const newAdminId = "admin_" + crypto.randomBytes(8).toString("hex");

      await db.insert(users).values({
        id: newAdminId,
        email: normalizedEmail,
        passwordHash,
        name: "System Administrator",
        role: "admin",
      });

      user = {
        id: newAdminId,
        email: normalizedEmail,
        passwordHash,
        name: "System Administrator",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (!user) {
      await logAuditEvent({
        action: "ADMIN_LOGIN_FAILED",
        requestHeaders: request.headers,
        details: { email: normalizedEmail, reason: "Account not found" },
      });
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email and password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      if (envDefaultPass && password === envDefaultPass && normalizedEmail === envAdminEmail) {
        const newHash = await hashPassword(password);
        await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));
      } else {
        await logAuditEvent({
          action: "ADMIN_LOGIN_FAILED",
          requestHeaders: request.headers,
          details: { email: normalizedEmail, reason: "Incorrect password" },
        });
        return NextResponse.json(
          { error: "Invalid credentials. Incorrect password." },
          { status: 401 }
        );
      }
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
      {
        error: error?.message || "An unexpected error occurred during authentication.",
      },
      { status: 500 }
    );
  }
}
