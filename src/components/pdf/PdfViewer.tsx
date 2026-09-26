"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface PdfViewerProps {
  token: string;
  fileName: string;
  onPrintComplete?: () => void;
}

export function PdfViewer({ token, fileName, onPrintComplete }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1.25);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Print workflow states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isAuthorizingPrint, setIsAuthorizingPrint] = useState<boolean>(false);
  const [isPrinted, setIsPrinted] = useState<boolean>(false);
  const [printError, setPrintError] = useState<string | null>(null);

  // Load PDF.js and document
  useEffect(() => {
    let isMounted = true;

    async function loadPdf() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        // Dynamically import pdfjs-dist
        const pdfjsLib = await import("pdfjs-dist");

        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;

        // Fetch authenticated raw PDF bytes
        const response = await fetch(`/api/document/${token}/raw`, {
          method: "GET",
          headers: {
            "Accept": "application/pdf",
          },
        });

        if (!response.ok) {
          if (response.status === 410) {
            throw new Error("This document access link has already been used or has expired.");
          } else if (response.status === 404) {
            throw new Error("Document not found or invalid access token.");
          } else {
            throw new Error(`Failed to load document (HTTP ${response.status})`);
          }
        }

        const arrayBuffer = await response.arrayBuffer();
        if (!isMounted) return;

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          disableAutoFetch: true,
          disableStream: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("PDF Load Error:", err);
        setErrorMessage(err.message || "Failed to render PDF document.");
        setIsLoading(false);
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Render current page onto canvas
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoomScale });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform =
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Page Render Error:", err);
      }
    },
    [pdfDoc, zoomScale]
  );

  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, zoomScale, renderPage]);

  // Page Controls
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleFitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    const containerWidth = containerRef.current.clientWidth - 48; // padding
    if (containerWidth > 0) {
      // Standard A4 width is ~595px at scale 1.0
      const calculatedScale = Math.min(containerWidth / 620, 2.0);
      setZoomScale(Math.max(calculatedScale, 0.8));
    }
  };

  // One-Time Print Execution Workflow
  const handleConfirmPrint = async () => {
    try {
      setIsAuthorizingPrint(true);
      setPrintError(null);

      // Server-side atomic validation and invalidation
      const response = await fetch(`/api/document/${token}/print`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setPrintError(data.error || "Failed to authorize print. The document may have expired or already been used.");
        setIsAuthorizingPrint(false);
        return;
      }

      // Close modal and transition viewer into permanently consumed state
      setIsPrintModalOpen(false);
      setIsAuthorizingPrint(false);
      setIsPrinted(true);

      if (onPrintComplete) {
        onPrintComplete();
      }

      // Trigger native browser print dialog
      setTimeout(() => {
        window.print();
      }, 300);
    } catch (err: any) {
      setPrintError(err.message || "Network error during print initiation.");
      setIsAuthorizingPrint(false);
    }
  };

  if (isPrinted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-zinc-200 rounded-lg shadow-xs dark:bg-zinc-950 dark:border-zinc-800">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4 dark:bg-zinc-800 dark:text-zinc-100">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Document Print Initiated
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
          This one-time document access token has been consumed and permanently invalidated. The file can no longer be viewed or printed using this link.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-100 text-xs font-mono text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
          <Lock className="w-3.5 h-3.5" />
          Status: PRINTED (Token Inactive)
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-zinc-200 rounded-lg shadow-xs dark:bg-zinc-950 dark:border-zinc-800">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4 dark:bg-red-950/50 dark:text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Document Unavailable
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
          {errorMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      {/* Top Security Banner */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 text-zinc-100 text-xs font-medium dark:bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2 truncate">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="truncate font-semibold">{fileName}</span>
        </div>
        <div className="shrink-0 text-zinc-400 font-mono text-[11px]">
          Single-Use Print Access
        </div>
      </div>

      {/* Main PDF Rendering Area */}
      <div
        ref={containerRef}
        onContextMenu={(e) => e.preventDefault()}
        className="relative flex items-center justify-center min-h-[560px] p-6 overflow-auto bg-zinc-200/70 dark:bg-zinc-950 select-none"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              Loading secure document stream...
            </p>
          </div>
        ) : (
          <div className="shadow-lg border border-zinc-300 dark:border-zinc-800 bg-white transition-all">
            <canvas ref={canvasRef} className="block mx-auto" />
          </div>
        )}
      </div>

      {/* Bottom Viewer Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        {/* Page Navigation */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
            aria-label="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 px-2 select-none">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isLoading}
            aria-label="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={isLoading || zoomScale <= 0.75}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 w-12 text-center select-none">
            {Math.round(zoomScale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={isLoading || zoomScale >= 3.0}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitWidth}
            disabled={isLoading}
            title="Fit Width"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Primary Action: PRINT */}
        <div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsPrintModalOpen(true)}
            disabled={isLoading || totalPages === 0}
            className="gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Printer className="h-4 w-4" />
            <span>Print Document</span>
          </Button>
        </div>
      </div>

      {/* Confirmation Modal before atomic print authorization */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => !isAuthorizingPrint && setIsPrintModalOpen(false)}
        title="Confirm One-Time Print"
        description="Important: This action is irreversible."
        maxWidth="md"
      >
        <div className="space-y-4 py-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs leading-relaxed dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">Single-Use Link Consumption Notice</p>
            <p>
              When you click &quot;Authorize &amp; Print&quot;, the server will immediately invalidate this access token. The document cannot be opened again after print initiation. Ensure your printer is powered on and connected.
            </p>
          </div>

          {printError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-900 text-xs dark:bg-red-950/40 dark:border-red-800 dark:text-red-200">
              {printError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintModalOpen(false)}
              disabled={isAuthorizingPrint}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmPrint}
              isLoading={isAuthorizingPrint}
              className="bg-zinc-900 text-white"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Authorize &amp; Print
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
