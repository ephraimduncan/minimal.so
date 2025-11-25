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

  const hexMatch = trimmed.match(
    /^#?([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/
  );
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    return { isColor: true, hex: `#${hex}`, original: trimmed };
  }

  const rgbMatch = trimmed.match(
    /^rgba?\s*$$\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*$$$/i
  );
  if (rgbMatch) {
    const r = Number.parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = Number.parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = Number.parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return { isColor: true, hex: `#${r}${g}${b}`, original: trimmed };
  }

  const hslMatch = trimmed.match(
    /^hsla?\s*$$\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?(?:\s*,\s*[\d.]+)?\s*$$$/i
  );
  if (hslMatch) {
    const h = Number.parseInt(hslMatch[1]);
    const s = Number.parseInt(hslMatch[2]) / 100;
    const l = Number.parseInt(hslMatch[3]) / 100;
    const hex = hslToHex(h, s, l);
    return { isColor: true, hex, original: trimmed };
  }

  return { isColor: false };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
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

export function isUrl(value: string): boolean {
  return !!value.match(/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}/i);
}

export function normalizeUrl(value: string): string {
  return value.startsWith("http") ? value : `https://${value}`;
}
