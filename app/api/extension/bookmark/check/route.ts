import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { canonicalizeUrl } from "@/lib/utils";
import { z } from "zod";

const checkSchema = z.object({
  urls: z.array(z.string()).min(1).max(100),
});

const extensionId = process.env.CHROME_EXTENSION_ID;

function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  if (extensionId) origins.push(`chrome-extension://${extensionId}`);
  if (process.env.NODE_ENV === "development")
    origins.push("http://localhost:3000");
  return origins;
}

function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = getAllowedOrigins();
  const allowed = origin && allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  const allowedOrigins = getAllowedOrigins();

  if (!origin || !allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers },
    );
  }

  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers },
      );
    }

    const body = await request.json();
    const parsed = checkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request" },
        { status: 400, headers },
      );
    }

    const normalizedUrls = parsed.data.urls
      .map((u) => canonicalizeUrl(u))
      .filter((u): u is string => u !== null);

    if (normalizedUrls.length === 0) {
      return NextResponse.json({ saved: {} }, { status: 200, headers });
    }

    const existing = await db.bookmark.findMany({
      where: {
        userId: session.user.id,
        normalizedUrl: { in: normalizedUrls },
      },
      select: { normalizedUrl: true },
    });

    const savedSet = new Set(existing.map((b) => b.normalizedUrl));

    const saved: Record<string, boolean> = {};
    for (const url of parsed.data.urls) {
      const normalized = canonicalizeUrl(url);
      saved[url] = normalized ? savedSet.has(normalized) : false;
    }

    return NextResponse.json({ saved }, { status: 200, headers });
  } catch (error) {
    console.error("[Extension API] Check error:", error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500, headers },
    );
  }
}
