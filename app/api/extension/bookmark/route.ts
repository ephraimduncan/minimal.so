import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { getUrlMetadata } from "@/lib/url-metadata";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";

const createBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

const extensionId = process.env.CHROME_EXTENSION_ID;

function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  if (extensionId) {
    origins.push(`chrome-extension://${extensionId}`);
  }
  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000");
  }
  return origins;
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

function corsHeaders(origin: string | null) {
  const allowed = isAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  console.log("[Extension API] OPTIONS request from origin:", origin);
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  console.log("[Extension API] POST request received");
  console.log("[Extension API] Origin:", origin);
  console.log("[Extension API] Allowed origins:", getAllowedOrigins());
  console.log("[Extension API] Is allowed:", isAllowedOrigin(origin));

  if (!isAllowedOrigin(origin)) {
    console.log("[Extension API] Rejected - origin not allowed");
    return NextResponse.json(
      { error: "Forbidden", message: "Origin not allowed" },
      { status: 403, headers }
    );
  }

  try {
    const session = await getSession();
    console.log("[Extension API] Session user:", session?.user?.email ?? "none");

    if (!session?.user) {
      console.log("[Extension API] Rejected - not authenticated");
      return NextResponse.json(
        { error: "Unauthorized", message: "Please log in to save bookmarks" },
        { status: 401, headers }
      );
    }

    const body = await request.json();
    console.log("[Extension API] Request body:", body);

    const parsed = createBookmarkSchema.safeParse(body);

    if (!parsed.success) {
      console.log("[Extension API] Rejected - invalid body:", parsed.error);
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid URL provided" },
        { status: 400, headers }
      );
    }

    const { url, title: providedTitle } = parsed.data;

    const defaultGroup = await db.group.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    if (!defaultGroup) {
      console.log("[Extension API] Rejected - no group found for user");
      return NextResponse.json(
        {
          error: "No Group",
          message: "No bookmark group found. Please create one first.",
        },
        { status: 400, headers }
      );
    }

    const normalizedUrl = normalizeUrl(url);
    const metadata = await getUrlMetadata(normalizedUrl);
    const title = providedTitle || metadata.title || normalizedUrl;

    console.log("[Extension API] Creating bookmark:", { title, url: normalizedUrl, groupId: defaultGroup.id });

    const bookmark = await db.bookmark.create({
      data: {
        title,
        url: normalizedUrl,
        favicon: metadata.favicon,
        type: "link",
        groupId: defaultGroup.id,
        userId: session.user.id,
      },
    });

    console.log("[Extension API] Bookmark created:", bookmark.id);

    return NextResponse.json(
      {
        success: true,
        bookmark: {
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          groupName: defaultGroup.name,
        },
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("[Extension API] Error:", error);
    return NextResponse.json(
      { error: "Server Error", message: "Failed to save bookmark" },
      { status: 500, headers }
    );
  }
}
