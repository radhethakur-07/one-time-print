import React from "react";
import Link from "next/link";
import { Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-md w-full text-center space-y-4 p-8 border border-zinc-200 bg-white rounded-lg dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">404: Page Not Found</h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          The requested page or document does not exist. It may have been expired, revoked, or permanently deleted.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" size="sm" className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
