"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Files,
  Search,
  Copy,
  Check,
  QrCode as QrIcon,
  Ban,
  Trash2,
  RefreshCw,
  Plus,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { QrCodeModal } from "@/components/admin/QrCodeModal";
import { Modal } from "@/components/ui/Modal";
import { formatBytes, formatDate } from "@/lib/utils";

interface DocumentItem {
  id: string;
  fileName: string;
  status: "ACTIVE" | "PRINTING" | "PRINTED" | "EXPIRED" | "REVOKED" | "DELETED";
  fileSize: number;
  mimeType: string;
  pageCount: number;
  createdAt: string;
  expiresAt: string | null;
  printedAt: string | null;
  revokedAt: string | null;
  deletedAt: string | null;
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // QR Modal
  const [qrModalState, setQrModalState] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
  }>({
    isOpen: false,
    title: "",
    url: "",
  });

  // Action confirmations
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [revokeDoc, setRevokeDoc] = useState<DocumentItem | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("query", searchQuery.trim());

      const res = await fetch(`/api/admin/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Fetch Documents Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCopyLink = async (docId: string) => {
    // Note: Since raw tokens are high entropy and stored only as hashes,
    // if the admin wants to share the link later, we explain or show QR code if available during upload
    const origin = window.location.origin;
    // In strict security model, raw token is shown once at upload time.
    setCopiedId(docId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmRevoke = async () => {
    if (!revokeDoc) return;
    try {
      setIsRevoking(true);
      const res = await fetch(`/api/admin/documents/${revokeDoc.id}/revoke`, {
        method: "POST",
      });
      if (res.ok) {
        setRevokeDoc(null);
        fetchDocuments();
      }
    } catch (err) {
      console.error("Revoke error:", err);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDoc) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/documents/${deleteDoc.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteDoc(null);
        fetchDocuments();
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Document Repository
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Monitor, revoke, and purge one-time secure print records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDocuments()}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/admin/upload">
            <Button variant="primary" size="sm" className="gap-1 text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <Plus className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {["ALL", "ACTIVE", "PRINTED", "EXPIRED", "REVOKED", "DELETED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === status
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono uppercase tracking-wider text-[10px] dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="p-4">Document / File Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Size</th>
                <th className="p-4">Created</th>
                <th className="p-4">Expires</th>
                <th className="p-4">Printed</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Loading records...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No documents found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100 max-w-[220px] truncate">
                      {doc.fileName}
                    </td>
                    <td className="p-4">
                      <Badge status={doc.status} />
                    </td>
                    <td className="p-4 font-mono text-zinc-600 dark:text-zinc-400">
                      {formatBytes(doc.fileSize)}
                    </td>
                    <td className="p-4 text-zinc-500 font-mono">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="p-4 text-zinc-500 font-mono">
                      {doc.expiresAt ? formatDate(doc.expiresAt) : "Never"}
                    </td>
                    <td className="p-4 text-zinc-500 font-mono">
                      {doc.printedAt ? formatDate(doc.printedAt) : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Revoke Token"
                            onClick={() => setRevokeDoc(doc)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 p-1.5 h-7"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {doc.status !== "DELETED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Document & Storage Object"
                            onClick={() => setDeleteDoc(doc)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 h-7"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Revoke Confirmation Modal */}
      <Modal
        isOpen={Boolean(revokeDoc)}
        onClose={() => !isRevoking && setRevokeDoc(null)}
        title="Revoke Access Token"
        description="Permanently revoke recipient access to this document."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Are you sure you want to revoke the one-time link for{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {revokeDoc?.fileName}
            </span>
            ? The recipient will immediately receive an access revoked notification.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevokeDoc(null)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmRevoke}
              isLoading={isRevoking}
            >
              Revoke Token
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteDoc)}
        onClose={() => !isDeleting && setDeleteDoc(null)}
        title="Delete Document & Storage Object"
        description="Permanently delete the database record and Cloudflare R2 binary."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            This action will permanently delete{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {deleteDoc?.fileName}
            </span>{" "}
            from Cloudflare R2 and update the status to DELETED.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDoc(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={qrModalState.isOpen}
        onClose={() => setQrModalState({ isOpen: false, title: "", url: "" })}
        documentTitle={qrModalState.title}
        oneTimeUrl={qrModalState.url}
      />
    </div>
  );
}
