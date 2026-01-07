export interface UrlMetadata {
  title: string | null;
  favicon: string | null;
  fetchedAt: number;
}

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
        "User-Agent": "Mozilla/5.0 (compatible; minimal/1.0)",
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

export async function getUrlMetadata(url: string): Promise<UrlMetadata> {
  const { metadata } = await fetchUrlMetadata(url);
  return metadata;
}
