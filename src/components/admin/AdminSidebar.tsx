"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  Settings,
  Shield,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Documents",
    href: "/admin/documents",
    icon: Files,
    exact: false,
  },
  {
    label: "Upload PDF",
    href: "/admin/upload",
    icon: UploadCloud,
    exact: false,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    exact: false,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50/50 flex flex-col justify-between shrink-0 dark:border-zinc-800 dark:bg-zinc-950/50">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-50 dark:text-zinc-900 shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                OneTimePrint
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-colors select-none",
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-850 dark:hover:text-zinc-100"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <span>Public Gateway</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
        <div className="px-2 py-1 text-[11px] font-mono text-zinc-400">
          v1.0.0 Cloud Production
        </div>
      </div>
    </aside>
  );
}
