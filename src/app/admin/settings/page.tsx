"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Database,
  Cloud,
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function AdminSettingsPage() {
  const [statusData, setStatusData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/setup");
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.error("Status fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunBootstrap = async () => {
    try {
      setIsBootstrapping(true);
      setBootstrapMessage(null);
      const res = await fetch("/api/admin/setup", { method: "POST" });
      const data = await res.json();
      setBootstrapMessage(data.message || (data.success ? "Schema verified." : data.error));
      fetchStatus();
    } catch (err: any) {
      setBootstrapMessage(err.message || "Schema bootstrap failed.");
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Infrastructure &amp; Security Settings
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Verify Cloudflare R2 storage, Neon database connectivity, and security configuration.
        </p>
      </div>

      {/* Cloud Service Health Diagnostics */}
      <Card>
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cloud Infrastructure Status</CardTitle>
            <CardDescription>Live connection status for Neon and Cloudflare R2</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Check Health
          </Button>
        </CardHeader>

        <CardContent className="p-5 pt-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Neon PostgreSQL */}
            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Neon PostgreSQL
                  </span>
                </div>
                {statusData?.checks?.databaseUrl ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                {statusData?.checks?.databaseUrl
                  ? "DATABASE_URL is connected and active."
                  : "DATABASE_URL is missing in environment variables."}
              </p>
            </div>

            {/* Cloudflare R2 */}
            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Cloudflare R2
                  </span>
                </div>
                {statusData?.checks?.r2Storage ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                Bucket: <span className="font-mono">{statusData?.r2Bucket || "Unconfigured"}</span>
              </p>
            </div>

            {/* JWT Auth Secret */}
            <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Auth Secret
                  </span>
                </div>
                {statusData?.checks?.authSecret ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                {statusData?.checks?.authSecret
                  ? "AUTH_SECRET configured for serverless session signing."
                  : "AUTH_SECRET missing. Using fallback for local testing."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Schema Sync & Bootstrap */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle>Database Schema Sync &amp; Bootstrap</CardTitle>
          <CardDescription>
            Ensures all PostgreSQL tables, indexes, and default administrator accounts are created on Neon.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 pt-2 space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            When connecting a brand-new Neon database on Vercel, this action runs the DDL schema verification to initialize the <code>users</code>, <code>documents</code>, and <code>audit_logs</code> tables and indexes.
          </p>

          {bootstrapMessage && (
            <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 text-xs font-mono dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200">
              {bootstrapMessage}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRunBootstrap}
            isLoading={isBootstrapping}
            className="text-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Verify / Bootstrap Database Schema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
