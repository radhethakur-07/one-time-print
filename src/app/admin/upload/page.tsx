"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  QrCode as QrIcon,
  AlertCircle,
  Clock,
  Shield,
  ArrowLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { QrCodeModal } from "@/components/admin/QrCodeModal";
import { formatBytes } from "@/lib/utils";

export default function AdminUploadPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [expirationOption, setExpirationOption] = useState<string>("24hours");
  const [customExpiresAt, setCustomExpiresAt] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Success state
  const [createdDocument, setCreatedDocument] = useState<{
    id: string;
    fileName: string;
    oneTimeUrl: string;
    rawToken: string;
    fileSize: number;
    expiresAt: string | null;
  } | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setUploadError(null);
    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setUploadError("Only PDF documents are accepted.");
      return;
    }
    // Check 25MB limit
    if (selectedFile.size > 25 * 1024 * 1024) {
      setUploadError("File size exceeds 25MB maximum limit.");
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Please select a PDF file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("expirationOption", expirationOption);
      if (expirationOption === "custom" && customExpiresAt) {
        formData.append("customExpiresAt", new Date(customExpiresAt).toISOString());
      }

      const res = await fetch("/api/admin/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Failed to upload and secure PDF.");
        setIsUploading(false);
        return;
      }

      setCreatedDocument(data.document);
      setIsUploading(false);
    } catch (err: any) {
      setUploadError(err.message || "An unexpected upload error occurred.");
      setIsUploading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdDocument?.oneTimeUrl) return;
    try {
      await navigator.clipboard.writeText(createdDocument.oneTimeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      console.error("Failed to copy link");
    }
  };

  const handleReset = () => {
    setFile(null);
    setCreatedDocument(null);
    setUploadError(null);
    setExpirationOption("24hours");
    setCustomExpiresAt("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/documents">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Upload PDF Document
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Generate a high-entropy one-time access token for secure printing.
            </p>
          </div>
        </div>
      </div>

      {createdDocument ? (
        /* Success Screen */
        <Card className="border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/50 dark:bg-emerald-950/10">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-emerald-950 dark:text-emerald-100">
                  One-Time Print Link Generated
                </CardTitle>
                <CardDescription className="text-emerald-700 dark:text-emerald-300">
                  {createdDocument.fileName} ({formatBytes(createdDocument.fileSize)})
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-6">
            {/* Generated URL Box */}
            <div className="p-4 bg-white border border-emerald-200 rounded-lg shadow-xs dark:bg-zinc-900 dark:border-zinc-800 space-y-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                One-Time Access Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdDocument.oneTimeUrl}
                  className="flex-1 font-mono text-xs bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-zinc-800 select-all dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQrModalOpen(true)}
                  className="shrink-0"
                >
                  <QrIcon className="w-3.5 h-3.5 mr-1" />
                  QR Code
                </Button>
              </div>
            </div>

            {/* Security Summary */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-md dark:bg-zinc-900/60 dark:border-zinc-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Security Guarantee</span>
              </div>
              <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-1 text-[11px] leading-relaxed">
                <li>Raw token is stored ONLY as a 256-bit SHA-256 hash in Neon PostgreSQL.</li>
                <li>PDF binary is encrypted and stored in private Cloudflare R2 bucket.</li>
                <li>Single-use atomic print lock: link expires permanently once recipient clicks Print.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
              <Link href="/admin/documents">
                <Button variant="outline" size="sm">
                  View in Repository
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Upload Another Document
              </Button>
            </div>
          </CardContent>

          {/* QR Code Modal */}
          <QrCodeModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            documentTitle={createdDocument.fileName}
            oneTimeUrl={createdDocument.oneTimeUrl}
          />
        </Card>
      ) : (
        /* Upload Form */
        <form onSubmit={handleUpload} className="space-y-6">
          <Card>
            <CardHeader className="p-6 pb-2">
              <CardTitle>Select Document</CardTitle>
              <CardDescription>
                Upload a PDF file (up to 25MB). File signatures will be validated.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-4 space-y-5">
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-red-900 text-xs dark:bg-red-950/50 dark:border-red-800 dark:text-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <p>{uploadError}</p>
                </div>
              )}

              {/* Drag and Drop Box */}
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                      : "border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Click to choose PDF or drag &amp; drop
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Standard PDF documents up to 25 MB
                    </span>
                  </div>
                </div>
              ) : (
                /* Selected File Preview */
                <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50 flex items-center justify-between dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-100 dark:text-zinc-900">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-sm">
                        {file.name}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {formatBytes(file.size)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Expiration Settings */}
              <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Access Token Expiration Policy
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "1hour", label: "1 Hour" },
                    { id: "24hours", label: "24 Hours (Default)" },
                    { id: "7days", label: "7 Days" },
                    { id: "never", label: "No Expiration" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExpirationOption(opt.id)}
                      className={`p-2.5 rounded-md border text-xs font-medium text-center transition-colors ${
                        expirationOption === opt.id
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  isLoading={isUploading}
                  disabled={!file}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Generate Secure One-Time Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
