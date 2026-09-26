import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: "ACTIVE" | "PRINTING" | "PRINTED" | "EXPIRED" | "REVOKED" | "DELETED" | "DEFAULT";
}

export function Badge({ className, status = "DEFAULT", children, ...props }: BadgeProps) {
  const statusStyles = {
    ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    PRINTING: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    PRINTED: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    EXPIRED: "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    REVOKED: "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
    DELETED: "bg-zinc-200 text-zinc-600 border-zinc-400 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800",
    DEFAULT: "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border",
        statusStyles[status] || statusStyles.DEFAULT,
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
}
