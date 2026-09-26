"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Application Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-md w-full text-center space-y-4 p-8 border border-zinc-200 bg-white rounded-lg dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">500: Unexpected Error</h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          An error occurred while processing your request. Please try again or return to the homepage.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => reset()}>
            Try Again
          </Button>
          <Link href="/">
            <Button variant="primary" size="sm" className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
