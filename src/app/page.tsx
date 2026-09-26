import React from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Printer,
  FileCheck,
  Server,
  KeyRound,
  ArrowRight,
  Database,
  Cloud,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <header className="h-16 border-b border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/80 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-50 dark:text-zinc-900">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight">
              OneTimePrint
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin Console
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-6 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-zinc-200 bg-white text-xs font-mono text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cryptographic Single-Use Document Authorization</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 max-w-3xl mx-auto leading-tight">
            Secure One-Time PDF Printing Infrastructure
          </h1>

          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Distribute sensitive PDF documents with single-use cryptographic tokens. Once the recipient initiates printing, the server-side token is atomically invalidated and permanently consumed.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link href="/admin/upload">
              <Button variant="primary" size="lg" className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 gap-2">
                <span>Provision Document Link</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/admin/documents">
              <Button variant="outline" size="lg">
                Manage Repository
              </Button>
            </Link>
          </div>
        </section>

        {/* Technical Architecture Overview */}
        <section className="py-16 px-6 bg-white dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Core Security Architecture
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Deterministic server-side authorization designed for cloud infrastructure.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3">
                <div className="w-10 h-10 rounded-md bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-100 dark:text-zinc-900">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  256-Bit Token Hashing
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Access URLs carry a 256-bit cryptographically secure random token. Only the SHA-256 hash is persisted in PostgreSQL, preventing database leak compromise.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3">
                <div className="w-10 h-10 rounded-md bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-100 dark:text-zinc-900">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Atomic Race Prevention
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Print authorization uses atomic SQL row-level state transitions. Simultaneous requests across multiple tabs or automated scrapers yield exactly one valid execution.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3">
                <div className="w-10 h-10 rounded-md bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-100 dark:text-zinc-900">
                  <Cloud className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Private Cloudflare R2 Storage
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  PDF binaries remain in private R2 storage with zero public URL exposure. Documents are streamed strictly through authenticated serverless route handlers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Controls & Boundaries Section */}
        <section className="py-16 px-6 max-w-5xl mx-auto space-y-8">
          <div className="border border-zinc-200 rounded-lg p-6 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Technical Security Boundaries</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="space-y-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                  Enforced Security Controls
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-[11px]">
                  <li>Server-side token verification before byte streaming</li>
                  <li>Atomic single-use status transition upon print call</li>
                  <li>No raw Cloudflare R2 URLs or credentials exposed to client</li>
                  <li>Automated magic-byte (%PDF-) validation on upload</li>
                  <li>Client IP rate limiting and privacy-hashed audit trails</li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                  Client Environment Boundaries
                </span>
                <p className="text-[11px] leading-relaxed">
                  While direct download buttons and file URLs are withheld, no web application can prevent physical photography, OS-level screen captures, or hardware printer spooler manipulation. The platform enforces single-use authorization and document lifecycle control.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 py-8 px-6 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-50 dark:text-zinc-900">
              <Shield className="w-3 h-3" />
            </div>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              OneTimePrint
            </span>
            <span>— Enterprise One-Time PDF Infrastructure</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Terms of Service
            </Link>
            <Link href="/admin" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
