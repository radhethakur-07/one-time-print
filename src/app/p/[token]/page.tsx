import React from "react";
import { Metadata } from "next";
import { db, documents } from "@/db";
import { hashAccessToken } from "@/lib/security/token";
import { eq } from "drizzle-orm";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { Shield, AlertCircle, Clock, Ban, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  return {
    title: "Secure One-Time Document Access — OneTimePrint",
    description: "Single-use confidential document viewer and printing portal.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function RecipientDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || typeof token !== "string" || token.length < 16) {
    return (
      <InvalidDocumentState
        icon={AlertCircle}
        title="Invalid Access Link"
        description="The provided one-time access token is malformed or invalid."
      />
    );
  }

  const tokenHash = hashAccessToken(token);

  let doc = null;
  try {
    const docRecords = await db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        status: documents.status,
        fileSize: documents.fileSize,
        pageCount: documents.pageCount,
        createdAt: documents.createdAt,
        expiresAt: documents.expiresAt,
        printedAt: documents.printedAt,
        revokedAt: documents.revokedAt,
      })
      .from(documents)
      .where(eq(documents.tokenHash, tokenHash))
      .limit(1);

    doc = docRecords[0];
  } catch (error) {
    console.error("[Document View Page DB Error]:", error);
    return (
      <InvalidDocumentState
        icon={AlertCircle}
        title="Service Unavailable"
        description="Unable to verify document authorization. Please try again shortly."
      />
    );
  }

  if (!doc) {
    return (
      <InvalidDocumentState
        icon={AlertCircle}
        title="Document Unavailable"
        description="This document does not exist or the access link is invalid."
      />
    );
  }

  // Handle Expired State
  if (doc.status === "ACTIVE" && doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
    try {
      await db.update(documents).set({ status: "EXPIRED" }).where(eq(documents.id, doc.id));
    } catch {}
    return (
      <InvalidDocumentState
        icon={Clock}
        title="Document Expired"
        description={`This one-time access link expired on ${formatDate(doc.expiresAt)}.`}
      />
    );
  }

  if (doc.status === "EXPIRED") {
    return (
      <InvalidDocumentState
        icon={Clock}
        title="Document Expired"
        description="This one-time access link has expired and is no longer viewable."
      />
    );
  }

  // Handle Already Printed State
  if (doc.status === "PRINTED" || doc.status === "PRINTING") {
    return (
      <InvalidDocumentState
        icon={CheckCircle2}
        title="Document Already Printed"
        description={`This single-use document was printed on ${formatDate(doc.printedAt)}. The access token is permanently consumed.`}
      />
    );
  }

  // Handle Revoked State
  if (doc.status === "REVOKED") {
    return (
      <InvalidDocumentState
        icon={Ban}
        title="Access Revoked"
        description="Access to this document has been revoked by the administrator."
      />
    );
  }

  // Handle Deleted State
  if (doc.status === "DELETED") {
    return (
      <InvalidDocumentState
        icon={AlertCircle}
        title="Document Deleted"
        description="This document has been removed by the administrator."
      />
    );
  }

  // Active Document View
  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-zinc-200 bg-white px-6 flex items-center justify-between dark:border-zinc-800 dark:bg-zinc-900/80 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-50 dark:text-zinc-900">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            OneTimePrint
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Single-Use Active Token</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col items-center justify-center">
        <PdfViewer token={token} fileName={doc.fileName} />
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-center text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OneTimePrint Secure Document Gateway</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InvalidDocumentState({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 font-sans">
      <header className="h-16 border-b border-zinc-200 bg-white px-6 flex items-center justify-between dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-50 dark:text-zinc-900">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            OneTimePrint
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-white border border-zinc-200 rounded-lg text-center shadow-xs dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Icon className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/"
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
