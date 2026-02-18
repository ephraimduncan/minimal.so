import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";
import {
  getAllowedOrigins,
  corsHeaders,
  jsonError,
  handleOptions,
} from "../shared";

const IMPORT_LIMIT = 2000;
const CHUNK_SIZE = 500;
const IMPORTED_GROUP_NAME = "Imported - Browser";
const IMPORTED_GROUP_COLOR = "#6366f1";

const importBookmarkSchema = z.object({
  title: z.string(),
  url: z.string(),
});

const importRequestSchema = z.object({
  bookmarks: z.array(importBookmarkSchema),
});

const allowedOrigins = getAllowedOrigins({ includeWebOrigin: true });

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return handleOptions(request, allowedOrigins);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin, allowedOrigins);

  if (!origin || !allowedOrigins.includes(origin)) {
    return jsonError("Origin not allowed", "Forbidden", 403, headers);
  }

  try {
    const session = await getSession();
    if (!session?.user) {
      return jsonError(
        "Please log in to import bookmarks",
        "Unauthorized",
        401,
        headers
      );
    }

    const body = await request.json();
    const parsed = importRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        "Invalid payload. Expected { bookmarks: Array<{ title, url }> }",
        "Bad Request",
        400,
        headers
      );
    }

    const userId = session.user.id;
    const incoming = parsed.data.bookmarks;
    const truncated = incoming.length > IMPORT_LIMIT;
    const capped = incoming.slice(0, IMPORT_LIMIT);

    const errorSummary: {
      invalidUrl?: number;
      duplicateInBatch?: number;
      duplicateInGroup?: number;
      chunkInsertFailed?: number;
    } = {};

    const validEntries: { title: string; url: string }[] = [];
    const seenUrls = new Set<string>();

    for (const entry of capped) {
      let normalized: string;
      try {
        normalized = normalizeUrl(entry.url);
        const parsedUrl = new URL(normalized);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          errorSummary.invalidUrl = (errorSummary.invalidUrl ?? 0) + 1;
          continue;
        }
      } catch {
        errorSummary.invalidUrl = (errorSummary.invalidUrl ?? 0) + 1;
        continue;
      }

      if (seenUrls.has(normalized)) {
        errorSummary.duplicateInBatch =
          (errorSummary.duplicateInBatch ?? 0) + 1;
        continue;
      }
      seenUrls.add(normalized);
      validEntries.push({ title: entry.title || normalized, url: normalized });
    }

    let group = await db.group.findFirst({
      where: { userId, name: IMPORTED_GROUP_NAME },
    });

    if (!group) {
      group = await db.group.create({
        data: {
          name: IMPORTED_GROUP_NAME,
          color: IMPORTED_GROUP_COLOR,
          userId,
        },
      });
    }

    const existingBookmarks = await db.bookmark.findMany({
      where: { userId, groupId: group.id },
      select: { url: true },
    });
    const existingUrls = new Set(existingBookmarks.map((b) => b.url));

    const toInsert = validEntries.filter((entry) => {
      if (existingUrls.has(entry.url)) {
        errorSummary.duplicateInGroup =
          (errorSummary.duplicateInGroup ?? 0) + 1;
        return false;
      }
      return true;
    });

    let importedCount = 0;

    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      try {
        await db.bookmark.createMany({
          data: chunk.map((entry) => ({
            title: entry.title,
            url: entry.url,
            type: "link",
            groupId: group.id,
            userId,
          })),
        });
        importedCount += chunk.length;
      } catch (error) {
        console.error("[Import API] Chunk insert failed:", error);
        errorSummary.chunkInsertFailed =
          (errorSummary.chunkInsertFailed ?? 0) + chunk.length;
      }
    }

    const skippedCount = capped.length - importedCount;
    const durationMs = Date.now() - startTime;

    console.log(
      `[Import API] userId=${userId} inputCount=${incoming.length} importedCount=${importedCount} skippedCount=${skippedCount} truncated=${truncated} durationMs=${durationMs}`
    );

    const hasErrors = Object.keys(errorSummary).length > 0;

    return NextResponse.json(
      {
        success: true,
        groupId: group.id,
        groupName: IMPORTED_GROUP_NAME,
        importedCount,
        skippedCount,
        truncated,
        limit: IMPORT_LIMIT,
        ...(hasErrors && { errorSummary }),
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("[Import API] Error:", error);
    return jsonError(
      "Failed to import bookmarks",
      "Server Error",
      500,
      headers
    );
  }
}
