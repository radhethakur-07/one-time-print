"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminHeaderProps {
  userEmail?: string;
  userName?: string;
}

export function AdminHeader({ userEmail, userName }: AdminHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 border-b border-zinc-200 bg-white px-6 flex items-center justify-between dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-mono dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>R2 &amp; Neon Online</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 text-right">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {userName || "Administrator"}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              {userEmail || "admin@onetimeprint.internal"}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          isLoading={isLoggingOut}
          className="text-xs"
        >
          <LogOut className="w-3.5 h-3.5 mr-1" />
          Logout
        </Button>
      </div>
    </header>
  );
}
