import React from "react";
import Link from "next/link";
import { db, documents, auditLogs } from "@/db";
import { getAdminSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  Files,
  FileCheck,
  Printer,
  Clock,
  Ban,
  UploadCloud,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatBytes } from "@/lib/utils";
import { sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Aggregate document stats
  let totalDocs = 0;
  let activeDocs = 0;
  let printedDocs = 0;
  let expiredDocs = 0;
  let revokedDocs = 0;
  let recentDocuments: any[] = [];
  let recentAuditLogs: any[] = [];

  try {
    const statsQuery = await db
      .select({
        status: documents.status,
        count: sql<number>`count(*)`,
      })
      .from(documents)
      .groupBy(documents.status);

    statsQuery.forEach((row) => {
      const count = Number(row.count);
      totalDocs += count;
      if (row.status === "ACTIVE") activeDocs = count;
      if (row.status === "PRINTED" || row.status === "PRINTING") printedDocs += count;
      if (row.status === "EXPIRED") expiredDocs = count;
      if (row.status === "REVOKED") revokedDocs = count;
    });

    recentDocuments = await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(5);

    recentAuditLogs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(6);
  } catch (error) {
    console.error("[Admin Dashboard Fetch Error]:", error);
  }

  const statCards = [
    {
      title: "Total Documents",
      value: totalDocs,
      description: "All managed documents",
      icon: Files,
      color: "text-zinc-900 dark:text-zinc-100",
    },
    {
      title: "Active Links",
      value: activeDocs,
      description: "Ready for one-time print",
      icon: FileCheck,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Printed Documents",
      value: printedDocs,
      description: "Successfully consumed",
      icon: Printer,
      color: "text-zinc-600 dark:text-zinc-400",
    },
    {
      title: "Expired Links",
      value: expiredDocs,
      description: "Past expiration limit",
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Revoked Links",
      value: revokedDocs,
      description: "Manually invalidated",
      icon: Ban,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header & Quick Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            System Overview
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time status of one-time PDF tokens, storage, and audit events.
          </p>
        </div>

        <Link href="/admin/upload">
          <Button variant="primary" size="md" className="gap-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <UploadCloud className="w-4 h-4" />
            <span>Upload New PDF</span>
          </Button>
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
                  {card.value}
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  {card.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid: Recent Documents & Audit Log Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents Table (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
            <div>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Latest provisioned one-time print links</CardDescription>
            </div>
            <Link
              href="/admin/documents"
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {recentDocuments.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No documents uploaded yet. Click &quot;Upload New PDF&quot; to generate your first link.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 flex items-center justify-between hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {doc.fileName}
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 font-mono">
                        <span>{formatBytes(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge status={doc.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Log Activity Feed (1 col) */}
        <Card>
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-500" />
                <span>Security Audit Trail</span>
              </CardTitle>
              <CardDescription>Recent tamper-evident events</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2">
            {recentAuditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No audit events recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-md border border-zinc-100 bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-900/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    {log.ipHash && (
                      <div className="text-[10px] text-zinc-400 font-mono truncate">
                        Client IP Hash: {log.ipHash.slice(0, 12)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
