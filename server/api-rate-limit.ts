// Sliding-window rate limiter. Two buckets per API key:
//   General: 60 req/min — Write (POST/PATCH/DELETE): 30 req/min
// Expired entries purged every 5 min.

const MAX_BUCKETS = 10_000;

const GENERAL_LIMIT = 60;
const WRITE_LIMIT = 30;
const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes

const WRITE_METHODS = new Set(["POST", "PATCH", "DELETE", "PUT"]);

interface BucketEntry {
  timestamps: number[];
}

const buckets = new Map<string, BucketEntry>();

function pruneAndCount(entry: BucketEntry, now: number): number {
  const windowStart = now - WINDOW_MS;
  let i = 0;
  while (i < entry.timestamps.length && entry.timestamps[i]! <= windowStart) {
    i++;
  }
  if (i > 0) {
    entry.timestamps = entry.timestamps.slice(i);
  }
  return entry.timestamps.length;
}

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

export function checkRateLimit(
  apiKey: string,
  method: string,
): RateLimitResult {
  if (buckets.size >= MAX_BUCKETS) {
    cleanupExpiredEntries();
    if (buckets.size >= MAX_BUCKETS) {
      return {
        allowed: false,
        limit: GENERAL_LIMIT,
        remaining: 0,
        resetAt: Math.ceil((Date.now() + WINDOW_MS) / 1000),
        retryAfter: 60,
      };
    }
  }

  const now = Date.now();
  const isWrite = WRITE_METHODS.has(method.toUpperCase());

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

    writeEntry.timestamps.push(now);

    const writeRemaining = WRITE_LIMIT - (writeCount + 1);
    const generalRemaining = GENERAL_LIMIT - (generalCount + 1);

    generalEntry.timestamps.push(now);

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

  generalEntry.timestamps.push(now);

  return {
    allowed: true,
    limit: GENERAL_LIMIT,
    remaining: GENERAL_LIMIT - (generalCount + 1),
    resetAt: generalResetAt,
  };
}

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

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    pruneAndCount(entry, now);
    if (entry.timestamps.length === 0) {
      buckets.delete(key);
    }
  }
}

const cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
  cleanupTimer.unref();
}
