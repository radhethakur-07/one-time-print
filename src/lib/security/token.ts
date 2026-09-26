import crypto from "crypto";

/**
 * Generates a high-entropy cryptographically secure random token (256-bit / 64 hex chars).
 */
export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Computes a SHA-256 hash of the plain access token.
 * Only this hash is stored in the database.
 */
export function hashAccessToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Performs a timing-safe comparison of two hash strings to defend against side-channel attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Builds the canonical public recipient link for a given token.
 */
export function buildDocumentUrl(token: string, baseUrl?: string): string {
  const origin =
    baseUrl ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const cleanOrigin = origin.replace(/\/+$/, "");
  return `${cleanOrigin}/p/${token}`;
}
