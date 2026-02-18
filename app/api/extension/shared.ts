import { NextRequest, NextResponse } from "next/server";

const extensionId = process.env.CHROME_EXTENSION_ID;

export function getAllowedOrigins(
  options?: { includeWebOrigin?: boolean },
): string[] {
  const origins: string[] = [];
  if (extensionId) origins.push(`chrome-extension://${extensionId}`);
  if (process.env.NODE_ENV === "development")
    origins.push("http://localhost:3000");
  if (options?.includeWebOrigin) origins.push("https://minimal.so");
  return origins;
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
