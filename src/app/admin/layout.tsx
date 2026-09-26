import React from "react";
import { getAdminSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // If not logged in and not on login route, we redirect in server components or page-level
  // Note: the login page has its own layout override or bypasses sidebar if not authenticated
  if (!session) {
    // For child pages under /admin (other than /admin/login), redirect to login
    // In Next.js App Router, layout applies to nested routes. To allow /admin/login,
    // we let it render or redirect appropriately.
  }

  return (
    <div className="flex h-screen w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden font-sans">
      {session ? (
        <>
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AdminHeader userEmail={session.email} userName={session.name} />
            <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50 dark:bg-zinc-950">
              {children}
            </main>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">{children}</div>
      )}
    </div>
  );
}
