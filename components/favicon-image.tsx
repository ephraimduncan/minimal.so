"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FaviconImageProps {
  url: string | null;
  className?: string;
}

function getHostname(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function FaviconImage({ url, className }: FaviconImageProps) {
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const hostname = getHostname(url);

  if (!hostname || errorUrl === url) {
    return (
      <div
        className={cn("flex h-5 w-5 items-center justify-center rounded bg-muted text-muted-foreground", className)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
      alt=""
      className={cn("h-5 w-5 rounded object-contain", className)}
      onError={() => setErrorUrl(url)}
    />
  );
}
