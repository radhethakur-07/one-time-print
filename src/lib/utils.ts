import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function calculateExpirationDate(
  option: "never" | "1hour" | "24hours" | "7days" | "custom",
  customIso?: string | null
): Date | null {
  const now = new Date();
  switch (option) {
    case "never":
      return null;
    case "1hour":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "24hours":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7days":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "custom":
      return customIso ? new Date(customIso) : null;
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
