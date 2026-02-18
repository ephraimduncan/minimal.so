/* eslint-disable @typescript-eslint/no-unused-vars */
const DEFAULT_BASE_URL = "https://minimal.so";

const BADGE = {
  login: { text: "!", color: "#f59e0b" },
  error: { text: "✗", color: "#ef4444" },
  success: { text: "✓", color: "#22c55e" },
};

const SOURCE = {
  MANUAL_POPUP: "manual_popup",
  MANUAL_CONTEXT_MENU: "manual_context_menu",
  MANUAL_SHORTCUT: "manual_shortcut",
  X_BOOKMARK: "x_bookmark",
  BROWSER_BOOKMARK: "browser_bookmark",
};

const IMPORT_GROUP = {
  X: "Imported - X",
  BROWSER: "Imported - Browser",
};

const IMPORT_GROUP_COLOR = "#6b7280";

const X_TOAST_RATE_LIMIT_MS = 5000;
const X_TOAST_BURST_WINDOW_MS = 2000;

const RESTRICTED_PROTOCOLS = [
  "chrome://",
  "chrome-extension://",
  "about:",
  "edge://",
  "file://",
  "brave://",
  "opera://",
  "vivaldi://",
];

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "twclid",
  "igshid",
  "mc_cid",
  "mc_eid",
];

function isRestrictedUrl(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  return RESTRICTED_PROTOCOLS.some((p) => lower.startsWith(p));
}

function canonicalizeUrl(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    if (trimmed.startsWith("//")) {
      withProtocol = "https:" + trimmed;
    } else {
      withProtocol = "https://" + trimmed;
    }
  }

  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.hash = "";

  const trackingSet = new Set(TRACKING_PARAMS);
  for (const key of [...parsed.searchParams.keys()]) {
    if (trackingSet.has(key.toLowerCase())) {
      parsed.searchParams.delete(key);
    }
  }
  parsed.searchParams.sort();

  let href = parsed.href;
  if (href.endsWith("/") && parsed.pathname === "/") {
    href = href.slice(0, -1);
  } else if (
    parsed.pathname.endsWith("/") &&
    parsed.pathname !== "/" &&
    !parsed.search
  ) {
    href = href.replace(/\/(\?|$)/, "$1");
  }

  return href;
}
