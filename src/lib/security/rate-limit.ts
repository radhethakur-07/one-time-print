import crypto from "crypto";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Global in-memory storage suitable for serverless / edge runtime instances
const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodically clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

/**
 * Extracts and cryptographically hashes the client's IP address for privacy-conscious tracking.
 */
export function getClientIpHash(requestHeaders: Headers): string {
  const cfIp = requestHeaders.get("cf-connecting-ip");
  const xForwardedFor = requestHeaders.get("x-forwarded-for");
  const xRealIp = requestHeaders.get("x-real-ip");

  const rawIp = cfIp || (xForwardedFor ? xForwardedFor.split(",")[0].trim() : xRealIp) || "127.0.0.1";

  // Use a secret salt for the IP hash if provided, or a stable daily hash
  const salt = process.env.AUTH_SECRET || "onetimeprint_ip_salt";
  return crypto.createHmac("sha256", salt).update(rawIp).digest("hex").slice(0, 32);
}

/**
 * Summarizes the User-Agent header safely for audit trails.
 */
export function getSanitizedUserAgent(requestHeaders: Headers): string {
  const ua = requestHeaders.get("user-agent") || "Unknown Client";
  return ua.slice(0, 255);
}

/**
 * Checks and increments rate limit for a specific key.
 * @param key Unique key (e.g. "login:ipHash" or "upload:ipHash")
 * @param maxRequests Maximum allowed requests in the time window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 20,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInMs: windowMs,
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, record.resetTime - now),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInMs: Math.max(0, record.resetTime - now),
  };
}
