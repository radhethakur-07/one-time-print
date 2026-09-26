"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Copy, Check, Download, QrCode as QrIcon } from "lucide-react";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  oneTimeUrl: string;
}

export function QrCodeModal({
  isOpen,
  onClose,
  documentTitle,
  oneTimeUrl,
}: QrCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && oneTimeUrl) {
      QRCode.toDataURL(oneTimeUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#09090b",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code Generation Error:", err));
    }
  }, [isOpen, oneTimeUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(oneTimeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      console.error("Failed to copy URL");
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `onetimeprint-qr-${documentTitle.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="One-Time Document QR Code"
      description="Scan or share this secure access link. The token expires immediately upon print initiation."
      maxWidth="md"
    >
      <div className="flex flex-col items-center space-y-4 py-2">
        <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-xs dark:border-zinc-800">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="One-Time Access QR Code"
              className="w-56 h-56 object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-zinc-400">
              <QrIcon className="h-8 w-8 animate-pulse" />
            </div>
          )}
        </div>

        <div className="w-full">
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            One-Time Access URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={oneTimeUrl}
              className="flex-1 font-mono text-xs bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-zinc-800 select-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="w-full flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadQr}
            disabled={!qrDataUrl}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Download QR
          </Button>
        </div>
      </div>
    </Modal>
  );
}
