import { createMiddleware } from "hono/factory";
import type { Context } from "hono";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyExtractor?: (c: Context) => string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function stopRateLimitCleanup() {
  clearInterval(cleanupInterval);
}

/**
 * Creates a simple in-memory rate limiting middleware.
 * @param config Rate limit configuration
 * @returns Hono middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyExtractor } = config;

  return createMiddleware(async (c, next) => {
    // Extract rate limit key (default: IP address)
    const key = keyExtractor
      ? keyExtractor(c)
      : c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
        c.req.header("x-real-ip") ||
        "unknown";

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry
      store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      await next();
      return;
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header("Retry-After", retryAfter.toString());
      return c.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        429
      );
    }

    // Increment counter
    entry.count++;
    await next();
  });
}
