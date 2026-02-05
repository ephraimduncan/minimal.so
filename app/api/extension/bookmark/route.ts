import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { getUrlMetadata } from "@/lib/url-metadata";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";

const createBookmarkSchema = z.object({
  url: z.url(),
  title: z.string().optional(),
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

function jsonError(
  message: string,
  error: string,
  status: number,
  headers: HeadersInit
) {
  return NextResponse.json({ error, message }, { status, headers });
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
    return jsonError("Origin not allowed", "Forbidden", 403, headers);
  }

  try {
    const session = await getSession();
    if (!session?.user) {
      return jsonError(
        "Please log in to save bookmarks",
        "Unauthorized",
        401,
        headers
      );
    }

    const body = await request.json();
    const parsed = createBookmarkSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid URL provided", "Bad Request", 400, headers);
    }

    const { url, title: providedTitle } = parsed.data;

    const defaultGroup = await db.group.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    if (!defaultGroup) {
      return jsonError(
        "No bookmark group found. Please create one first.",
        "No Group",
        400,
        headers
      );
    }

    const normalizedUrl = normalizeUrl(url);
    const metadataPromise = getUrlMetadata(normalizedUrl);

    const existing = await db.bookmark.findFirst({
      where: {
        userId: session.user.id,
        groupId: defaultGroup.id,
        url: normalizedUrl,
      },
    });
    const metadata = await metadataPromise;

    if (existing) {
      const bookmark = await db.bookmark.update({
        where: { id: existing.id, userId: session.user.id },
        data: {
          title: metadata.title || existing.title,
          favicon: metadata.favicon || existing.favicon,
          updatedAt: new Date(),
        },
      });

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
    }

    const title = providedTitle || metadata.title || normalizedUrl;

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
    return jsonError("Failed to save bookmark", "Server Error", 500, headers);
  }
}
