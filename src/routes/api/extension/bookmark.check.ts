import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { createDb, inList } from "@/lib/db";
import { bookmark } from "@/lib/db/schema";
import { canonicalizeUrl } from "@/lib/utils";
import {
  getAllowedOrigins,
  corsHeaders,
  handleOptions,
} from "@/lib/extension-cors";

const checkSchema = z.object({
  urls: z.array(z.string()).min(1).max(100),
});

async function handlePost(request: Request): Promise<Response> {
  const allowedOrigins = getAllowedOrigins();
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin, allowedOrigins);

  if (!origin || !allowedOrigins.includes(origin)) {
    return Response.json({ error: "Forbidden" }, { status: 403, headers });
  }

  try {
    const session = await getSession();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const body = await request.json();
    const parsed = checkSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Bad Request" }, { status: 400, headers });
    }

    const normalizedUrls = parsed.data.urls
      .map((u) => canonicalizeUrl(u))
      .filter((u): u is string => u !== null);

    if (normalizedUrls.length === 0) {
      return Response.json({ saved: {} }, { status: 200, headers });
    }

    const db = createDb();
    const existing = await db
      .select({ normalizedUrl: bookmark.normalizedUrl })
      .from(bookmark)
      .where(
        and(
          eq(bookmark.userId, session.user.id),
          inList(bookmark.normalizedUrl, normalizedUrls),
        ),
      );

    const savedSet = new Set(existing.map((b) => b.normalizedUrl));

    const saved: Record<string, boolean> = {};
    for (const url of parsed.data.urls) {
      const normalized = canonicalizeUrl(url);
      saved[url] = normalized ? savedSet.has(normalized) : false;
    }

    return Response.json({ saved }, { status: 200, headers });
  } catch (error) {
    console.error("[Extension API] Check error:", error);
    return Response.json({ error: "Server Error" }, { status: 500, headers });
  }
}

export const Route = createFileRoute("/api/extension/bookmark/check")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => handleOptions(request, getAllowedOrigins()),
      POST: ({ request }) => handlePost(request),
    },
  },
});
