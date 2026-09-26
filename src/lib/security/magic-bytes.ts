/**
 * Verifies that the uploaded buffer starts with the PDF magic header: "%PDF-" (0x25, 0x50, 0x44, 0x46, 0x2D).
 */
export function validatePdfMagicBytes(buffer: Buffer | Uint8Array): { valid: boolean; reason?: string } {
  if (!buffer || buffer.length < 5) {
    return { valid: false, reason: "File is too small to be a valid PDF document." };
  }

  // Check magic bytes: %PDF-
  const isPdfHeader =
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d;   // -

  if (!isPdfHeader) {
    return {
      valid: false,
      reason: "File signature header verification failed. The provided file is not a valid PDF binary.",
    };
  }

  return { valid: true };
}

/**
 * Sanitizes original filename for display and metadata storage.
 * Strips path traversal characters, control characters, and limits length.
 */
export function sanitizeFileName(name: string): string {
  const base = name.replace(/^.*[\\/]/, ""); // strip directories
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, "_").trim();
  if (!sanitized.toLowerCase().endsWith(".pdf")) {
    return `${sanitized.slice(0, 100)}.pdf`;
  }
  return sanitized.slice(0, 120);
}

/**
 * Parses and returns the configured maximum file size in bytes.
 * Default is 25MB.
 */
export function getMaxUploadSizeBytes(): number {
  const envSize = process.env.MAX_FILE_SIZE;
  if (envSize) {
    const parsed = parseInt(envSize, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 25 * 1024 * 1024; // 25 MB default
}
