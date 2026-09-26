import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — OneTimePrint",
  description: "Privacy practices and data handling architecture for OneTimePrint.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <header className="h-16 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-50 dark:text-zinc-900">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">OneTimePrint Privacy</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 space-y-8">
        <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-zinc-500 font-mono">Last updated: September 2026</p>
        </div>

        <div className="space-y-6 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              1. Overview and Architecture
            </h2>
            <p>
              OneTimePrint is engineered with a strict data-minimization architecture. Our service exists solely to provision single-use access tokens for controlled document printing. We do not sell, monetize, or track user browsing behavior across third-party networks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              2. Data Collection and Retention
            </h2>
            <p>We process the following categories of data strictly for service operation and audit verification:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Document Binaries:</strong> Uploaded PDF files are encrypted and stored in private Cloudflare R2 object storage. Documents can be purged at any time by the administrator.
              </li>
              <li>
                <strong>Access Tokens:</strong> Plain-text access tokens exist only within the URL string provided to the administrator upon generation. We store only one-way cryptographic SHA-256 hashes of tokens in Neon PostgreSQL.
              </li>
              <li>
                <strong>Audit Records:</strong> For security monitoring, rate limiting, and tamper detection, we record salted cryptographic hashes of client IP addresses and truncated User-Agent summaries. Raw IP addresses are not stored in audit logs.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              3. Document Lifecycle and Invalidation
            </h2>
            <p>
              When a recipient triggers the print action or when the configured expiration duration elapses, the document token status is updated to <code>PRINTED</code> or <code>EXPIRED</code>. Subsequent requests with that token are permanently rejected.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              4. Third-Party Infrastructure Providers
            </h2>
            <p>Our platform operates across the following cloud infrastructure providers:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Vercel:</strong> Serverless execution environment and edge routing.</li>
              <li><strong>Neon:</strong> Serverless PostgreSQL database hosting.</li>
              <li><strong>Cloudflare R2:</strong> Private S3-compatible encrypted object storage.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              5. Contact
            </h2>
            <p>
              For administrative inquiries regarding document retention or privacy audits, contact your organizational system administrator.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 py-6 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span>OneTimePrint</span>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
