import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — OneTimePrint",
  description: "Terms and conditions of use for the OneTimePrint platform.",
};

export default function TermsOfServicePage() {
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
            <span className="text-xs font-bold">OneTimePrint Terms</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 space-y-8">
        <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-xs text-zinc-500 font-mono">Last updated: September 2026</p>
        </div>

        <div className="space-y-6 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the OneTimePrint platform as an administrator or document recipient, you agree to comply with and be bound by these Terms of Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              2. Permitted Use and Authorization
            </h2>
            <p>
              Administrators are responsible for ensuring that all documents uploaded comply with applicable copyright, data protection, and confidentiality laws. You must not upload unlawful, malicious, or infringing content.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              3. Nature of Single-Use Print Controls
            </h2>
            <p>
              OneTimePrint provides an application-level single-use document viewing and print authorization workflow. While the server invalidates the cryptographic token immediately upon print initiation, the service does not and cannot control:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Physical hardware printer mechanics or paper jams.</li>
              <li>Operating system print spooler actions or cancellation by the user.</li>
              <li>External hardware captures, photography of the display, or screen recordings.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              4. Limitation of Liability
            </h2>
            <p>
              The platform is provided &quot;as is&quot; and &quot;as available&quot;. OneTimePrint and its operators disclaim all warranties, express or implied, including fitness for a particular purpose and non-infringement.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              5. Modifications
            </h2>
            <p>
              We reserve the right to update these terms at any time. Continued use of the platform constitutes acceptance of revised terms.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 py-6 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span>OneTimePrint</span>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
