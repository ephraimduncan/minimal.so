import { z } from "zod";
import { redis } from "./redis";

export interface UrlMetadata {
  title: string | null;
  favicon: string | null;
  fetchedAt: number;
}

const urlMetadataSchema = z.object({
  title: z.string().nullable(),
  favicon: z.string().nullable(),
  fetchedAt: z.number(),
});

const CACHE_TTL_SUCCESS = 60 * 60 * 24 * 7;
const CACHE_TTL_FAILURE = 60 * 5;

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0"
    ) {
      return false;
    }

    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      if (a === 10) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 169 && b === 254) return false;
      if (a === 127) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function normalizeUrlForCache(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.protocol}//${host}${path}${parsed.search}`;
  } catch {
    return url.toLowerCase();
  }
}

async function getCachedMetadata(url: string): Promise<UrlMetadata | null> {
  const cacheKey = `url:metadata:${normalizeUrlForCache(url)}`;
  const cached = await redis.get(cacheKey);
  if (!cached) {
    return null;
  }
  const parsed = urlMetadataSchema.safeParse(JSON.parse(cached));
  return parsed.success ? parsed.data : null;
}

async function cacheMetadata(
  url: string,
  metadata: UrlMetadata,
  ttl: number = CACHE_TTL_SUCCESS
): Promise<void> {
  const cacheKey = `url:metadata:${normalizeUrlForCache(url)}`;
  await redis.set(cacheKey, JSON.stringify(metadata), "EX", ttl);
}

interface FetchResult {
  metadata: UrlMetadata;
  success: boolean;
}

async function fetchUrlMetadata(url: string): Promise<FetchResult> {
  if (!isAllowedUrl(url)) {
    return {
      metadata: { title: null, favicon: null, fetchedAt: Date.now() },
      success: false,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; bmrks/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const metadata = parseHtmlMetadata(html, url);

    return {
      metadata: { ...metadata, fetchedAt: Date.now() },
      success: true,
    };
  } catch {
    return {
      metadata: { title: null, favicon: null, fetchedAt: Date.now() },
      success: false,
    };
  }
}

function parseHtmlMetadata(
  html: string,
  baseUrl: string
): Omit<UrlMetadata, "fetchedAt"> {
  let title: string | null = null;
  let favicon: string | null = null;

  const ogTitleMatch = html.match(
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogTitleMatch) {
    title = decodeHtmlEntities(ogTitleMatch[1]);
  } else {
    const ogTitleMatchAlt = html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i
    );
    if (ogTitleMatchAlt) {
      title = decodeHtmlEntities(ogTitleMatchAlt[1]);
    } else {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = decodeHtmlEntities(titleMatch[1].trim());
      }
    }
  }

  const iconPatterns = [
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i,
    /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']icon["']/i,
    /<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']shortcut icon["']/i,
  ];

  for (const pattern of iconPatterns) {
    const match = html.match(pattern);
    if (match) {
      const resolved = resolveUrl(match[1], baseUrl);
      if (resolved) {
        favicon = resolved;
        break;
      }
    }
  }

  if (!favicon) {
    try {
      const parsed = new URL(baseUrl);
      favicon = `${parsed.protocol}//${parsed.host}/favicon.ico`;
    } catch {}
  }

  return { title, favicon };
}

function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

export async function getUrlMetadata(
  url: string,
  options: { bypassCache?: boolean } = {}
): Promise<UrlMetadata> {
  if (!options.bypassCache) {
    const cached = await getCachedMetadata(url);
    if (cached) {
      return cached;
    }
  }

  const { metadata, success } = await fetchUrlMetadata(url);

  const ttl = success ? CACHE_TTL_SUCCESS : CACHE_TTL_FAILURE;
  await cacheMetadata(url, metadata, ttl);

  return metadata;
}
