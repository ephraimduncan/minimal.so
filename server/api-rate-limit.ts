/**
 * In-memory rate limiting for the public API.
 *
 * Two sliding-window buckets per API key:
 *   - General  : 60 requests / minute
 *   - Write    : 30 requests / minute (POST, PATCH, DELETE)
 *
 * Expired entries are purged every 5 minutes to prevent memory leaks.
 */

const GENERAL_LIMIT = 60;
const WRITE_LIMIT = 30;
const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes

const WRITE_METHODS = new Set(["POST", "PATCH", "DELETE", "PUT"]);

interface BucketEntry {
  timestamps: number[];
}

/** Per-key, per-bucket request timestamps. Key format: `${apiKey}:${bucket}` */
const buckets = new Map<string, BucketEntry>();

/**
 * Prune timestamps older than the current window and return the live count.
 */
function pruneAndCount(entry: BucketEntry, now: number): number {
  const windowStart = now - WINDOW_MS;
  // Remove expired timestamps from the front (oldest first)
  let i = 0;
  while (i < entry.timestamps.length && entry.timestamps[i]! <= windowStart) {
    i++;
  }
  if (i > 0) {
    entry.timestamps = entry.timestamps.slice(i);
  }
  return entry.timestamps.length;
}

/**
 * Get or create a bucket entry for the given key.
 */
function getEntry(key: string): BucketEntry {
  let entry = buckets.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    buckets.set(key, entry);
  }
  return entry;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp (seconds)
  retryAfter?: number; // seconds until window resets
}

/**
 * Check (and record) a request against both buckets.
 *
 * Returns the *tightest* limit info — i.e. whichever bucket is closer to
 * exhaustion dictates the headers. If either bucket is exceeded the request
 * is denied.
 */
export function checkRateLimit(
  apiKey: string,
  method: string,
): RateLimitResult {
  const now = Date.now();
  const isWrite = WRITE_METHODS.has(method.toUpperCase());

  // --- General bucket ---
  const generalEntry = getEntry(`${apiKey}:general`);
  const generalCount = pruneAndCount(generalEntry, now);
  const generalResetAt = Math.ceil((now + WINDOW_MS) / 1000);

  if (generalCount >= GENERAL_LIMIT) {
    const oldestInWindow = generalEntry.timestamps[0]!;
    const retryAfter = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      limit: GENERAL_LIMIT,
      remaining: 0,
      resetAt: generalResetAt,
      retryAfter: Math.max(retryAfter, 1),
    };
  }

  // --- Write bucket (only for mutating methods) ---
  if (isWrite) {
    const writeEntry = getEntry(`${apiKey}:write`);
    const writeCount = pruneAndCount(writeEntry, now);
    const writeResetAt = Math.ceil((now + WINDOW_MS) / 1000);

    if (writeCount >= WRITE_LIMIT) {
      const oldestInWindow = writeEntry.timestamps[0]!;
      const retryAfter = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000);
      return {
        allowed: false,
        limit: WRITE_LIMIT,
        remaining: 0,
        resetAt: writeResetAt,
        retryAfter: Math.max(retryAfter, 1),
      };
    }

    // Record the write timestamp
    writeEntry.timestamps.push(now);

    // Return write bucket info when it's the tighter constraint
    const writeRemaining = WRITE_LIMIT - (writeCount + 1);
    const generalRemaining = GENERAL_LIMIT - (generalCount + 1);

    // Record general timestamp too (writes also count towards the general bucket)
    generalEntry.timestamps.push(now);

    // Return whichever bucket is closer to exhaustion
    if (writeRemaining < generalRemaining) {
      return {
        allowed: true,
        limit: WRITE_LIMIT,
        remaining: writeRemaining,
        resetAt: writeResetAt,
      };
    }

    return {
      allowed: true,
      limit: GENERAL_LIMIT,
      remaining: generalRemaining,
      resetAt: generalResetAt,
    };
  }

  // --- Read-only request: only general bucket applies ---
  generalEntry.timestamps.push(now);

  return {
    allowed: true,
    limit: GENERAL_LIMIT,
    remaining: GENERAL_LIMIT - (generalCount + 1),
    resetAt: generalResetAt,
  };
}

/**
 * Build rate-limit headers to attach to every response.
 */
export function rateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
  };

  if (!result.allowed && result.retryAfter !== undefined) {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}

// ---------------------------------------------------------------------------
// Periodic cleanup of expired entries
// ---------------------------------------------------------------------------

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    pruneAndCount(entry, now);
    if (entry.timestamps.length === 0) {
      buckets.delete(key);
    }
  }
}

// Start cleanup interval (non-blocking, doesn't prevent process exit)
const cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
  cleanupTimer.unref();
}
