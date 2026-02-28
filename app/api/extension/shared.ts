import { NextRequest, NextResponse } from "next/server";
import { APP_URL } from "@/lib/config";

const extensionId = process.env.CHROME_EXTENSION_ID;

export function getAllowedOrigins(
  options?: { includeWebOrigin?: boolean },
): string[] {
  const origins = new Set<string>();
  if (extensionId) origins.add(`chrome-extension://${extensionId}`);
  if (process.env.NODE_ENV === "development") {
    origins.add("http://localhost:3000");
  }
  if (options?.includeWebOrigin) {
    origins.add(APP_URL);
  }
  return Array.from(origins);
}

export function corsHeaders(
  origin: string | null,
  allowedOrigins: string[],
): HeadersInit {
  const allowed = origin && allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function jsonError(
  message: string,
  error: string,
  status: number,
  headers: HeadersInit,
): NextResponse {
  return NextResponse.json({ error, message }, { status, headers });
}

export function handleOptions(request: NextRequest, allowedOrigins: string[]): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin"), allowedOrigins),
  });
}
