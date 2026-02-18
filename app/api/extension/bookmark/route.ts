import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { getUrlMetadata, isArxivHost } from "@/lib/url-metadata";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";
import {
  getAllowedOrigins,
  corsHeaders,
  jsonError,
  handleOptions,
} from "../shared";

const createBookmarkSchema = z.object({
  url: z.url(),
  title: z.string().optional(),
});

const allowedOrigins = getAllowedOrigins();

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return handleOptions(request, allowedOrigins);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin, allowedOrigins);

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

    const title = isArxivHost(normalizedUrl)
      ? metadata.title || providedTitle || normalizedUrl
      : providedTitle || metadata.title || normalizedUrl;

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
