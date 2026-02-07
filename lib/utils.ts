import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseColor(value: string): {
  isColor: boolean;
  hex?: string;
  original?: string;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isColor: false };
  }

  const hexMatch = trimmed.match(
    /^#?([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/
  );
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    return { isColor: true, hex: `#${hex}`, original: trimmed };
  }

  const rgbMatch = trimmed.match(
    /^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)\s*$/i
  );
  if (rgbMatch) {
    const clamp255 = (n: number) => Math.max(0, Math.min(255, n));
    const toHex2 = (n: number) =>
      Math.round(clamp255(n)).toString(16).padStart(2, "0");

    const r = toHex2(Number.parseInt(rgbMatch[1], 10));
    const g = toHex2(Number.parseInt(rgbMatch[2], 10));
    const b = toHex2(Number.parseInt(rgbMatch[3], 10));
    return { isColor: true, hex: `#${r}${g}${b}`, original: trimmed };
  }

  const hslMatch = trimmed.match(
    /^hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?(?:\s*,\s*[\d.]+)?\s*\)\s*$/i
  );
  if (hslMatch) {
    const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
    const h = Number.parseInt(hslMatch[1], 10);
    const s = clamp01(Number.parseInt(hslMatch[2], 10) / 100);
    const l = clamp01(Number.parseInt(hslMatch[3], 10) / 100);
    const hex = hslToHex(h, s, l);
    return { isColor: true, hex, original: trimmed };
  }

  return { isColor: false };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= hue && hue < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= hue && hue < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= hue && hue < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= hue && hue < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= hue && hue < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= hue && hue < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function isUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const url = new URL(normalizeUrl(trimmed));
    if (!["http:", "https:"].includes(url.protocol)) return false;

    // Avoid treating plain words like "test" as a URL.
    const hostname = url.hostname.toLowerCase();
    const isIpv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
    const isLocalhost = hostname === "localhost";
    const hasDot = hostname.includes(".");

    return hasDot || isLocalhost || isIpv4;
  } catch {
    return false;
  }
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Handle protocol-relative URLs (e.g. //example.com)
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
}
