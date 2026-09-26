import { NextResponse } from "next/server";
import { clearAdminSessionCookie, getAdminSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/security/audit";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (session) {
      await logAuditEvent({
        action: "ADMIN_LOGOUT",
        requestHeaders: request.headers,
        details: { userId: session.userId, email: session.email },
      });
    }

    await clearAdminSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch {
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 });
  }
}
