import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { createDb, type DB } from "@/lib/db";
import { bookmark, group } from "@/lib/db/schema";
import { getUrlMetadata, isArxivHost } from "@/lib/url-metadata";
import { MAX_URL_LENGTH } from "@/lib/schema";
import { canonicalizeUrl, normalizeUrl } from "@/lib/utils";
import {
  getAllowedOrigins,
  corsHeaders,
  jsonError,
  handleOptions,
} from "@/lib/extension-cors";

const sourceEnum = z.enum([
  "manual_popup",
  "manual_context_menu",
  "manual_shortcut",
  "x_bookmark",
  "browser_bookmark",
]);

const SOURCE_PRIORITY: Record<string, number> = {
  manual_popup: 0,
  manual_context_menu: 1,
  manual_shortcut: 2,
  x_bookmark: 3,
  browser_bookmark: 4,
};

const IMPORT_GROUP_MAP: Record<string, string> = {
  x_bookmark: "Imported - X",
  browser_bookmark: "Imported - Browser",
};

const IMPORT_GROUP_COLOR = "#6b7280";

const createBookmarkSchema = z.object({
  url: z.url().max(MAX_URL_LENGTH),
  title: z.string().optional(),
  source: sourceEnum.optional(),
  destinationGroup: z.string().optional(),
  capturedAt: z.string().datetime().optional(),
});

function parseSourceHistory(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendSourceHistory(
  existing: string[],
  currentSource: string,
  newSource: string,
): string[] {
  const history = [...existing];
  if (currentSource && !history.includes(currentSource)) {
    history.push(currentSource);
  }
  if (!history.includes(newSource)) {
    history.push(newSource);
  }
  return history;
}

function shouldReclassify(
  existingSource: string | null,
  existingCapturedAt: Date | null,
  newSource: string,
  newCapturedAt: Date,
): boolean {
  if (!existingSource) return true;
  if (!existingCapturedAt) return true;

  const existingTime = existingCapturedAt.getTime();
  const newTime = newCapturedAt.getTime();

  if (newTime > existingTime) return true;
  if (newTime < existingTime) return false;

  const existingPriority = SOURCE_PRIORITY[existingSource] ?? 99;
  const newPriority = SOURCE_PRIORITY[newSource] ?? 99;
  return newPriority <= existingPriority;
}

async function resolveDestinationGroup(
  db: DB,
  userId: string,
  source: string | undefined,
  destinationGroupName: string | undefined,
): Promise<{ id: string; name: string }> {
  const importGroupName =
    destinationGroupName || (source ? IMPORT_GROUP_MAP[source] : undefined);

  if (importGroupName) {
    const [existing] = await db
      .select({ id: group.id, name: group.name })
      .from(group)
      .where(and(eq(group.userId, userId), eq(group.name, importGroupName)))
      .limit(1);
    if (existing) return existing;

    const [created] = await db
      .insert(group)
      .values({ name: importGroupName, color: IMPORT_GROUP_COLOR, userId })
      .returning({ id: group.id, name: group.name });
    return created;
  }

  const [defaultGroup] = await db
    .select({ id: group.id, name: group.name })
    .from(group)
    .where(eq(group.userId, userId))
    .orderBy(asc(group.createdAt))
    .limit(1);

  if (!defaultGroup) {
    throw new Error("NO_GROUP");
  }

  return defaultGroup;
}

async function handlePost(request: Request): Promise<Response> {
  const allowedOrigins = getAllowedOrigins();
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
        headers,
      );
    }

    const body = await request.json();
    const parsed = createBookmarkSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid URL provided", "Bad Request", 400, headers);
    }

    const {
      url,
      title: providedTitle,
      source,
      destinationGroup,
      capturedAt,
    } = parsed.data;

    const db = createDb();
    const userId = session.user.id;
    const normalized = canonicalizeUrl(url);
    const eventTime = capturedAt ? new Date(capturedAt) : new Date();

    let targetGroup: { id: string; name: string };
    try {
      targetGroup = await resolveDestinationGroup(
        db,
        userId,
        source,
        destinationGroup,
      );
    } catch (err) {
      if (err instanceof Error && err.message === "NO_GROUP") {
        return jsonError(
          "No bookmark group found. Please create one first.",
          "No Group",
          400,
          headers,
        );
      }
      throw err;
    }

    const [existing] = await db
      .select()
      .from(bookmark)
      .where(and(eq(bookmark.userId, userId), eq(bookmark.normalizedUrl, normalized)))
      .limit(1);

    const metadataPromise = getUrlMetadata(normalizeUrl(url));

    if (existing) {
      const reclassify = source
        ? shouldReclassify(
            existing.primarySource,
            existing.lastCapturedAt,
            source,
            eventTime,
          )
        : false;

      const updatedHistory = source
        ? appendSourceHistory(
            parseSourceHistory(existing.sourceHistory),
            existing.primarySource || "",
            source,
          )
        : parseSourceHistory(existing.sourceHistory);

      const metadata = await metadataPromise;

      const updateData: Partial<typeof bookmark.$inferInsert> = {
        title: metadata.title || existing.title,
        favicon: metadata.favicon || existing.favicon,
        updatedAt: new Date(),
        sourceHistory: JSON.stringify(updatedHistory),
      };

      if (reclassify && source) {
        updateData.primarySource = source;
        updateData.lastCapturedAt = eventTime;
        updateData.groupId = targetGroup.id;
      }

      const [updated] = await db
        .update(bookmark)
        .set(updateData)
        .where(and(eq(bookmark.id, existing.id), eq(bookmark.userId, userId)))
        .returning();

      return Response.json(
        {
          success: true,
          action: reclassify ? "reclassified" : "updated",
          bookmark: {
            id: updated.id,
            title: updated.title,
            url: updated.url,
            groupName: targetGroup.name,
          },
        },
        { status: 200, headers },
      );
    }

    const metadata = await metadataPromise;
    const title = isArxivHost(normalizeUrl(url))
      ? metadata.title || providedTitle || normalized
      : providedTitle || metadata.title || normalized;

    const sourceHistory = source ? [source] : [];

    const [created] = await db
      .insert(bookmark)
      .values({
        title,
        url: normalizeUrl(url),
        normalizedUrl: normalized,
        favicon: metadata.favicon,
        type: "link",
        primarySource: source || null,
        sourceHistory: JSON.stringify(sourceHistory),
        lastCapturedAt: eventTime,
        groupId: targetGroup.id,
        userId,
      })
      .returning();

    return Response.json(
      {
        success: true,
        action: "created",
        bookmark: {
          id: created.id,
          title: created.title,
          url: created.url,
          groupName: targetGroup.name,
        },
      },
      { status: 200, headers },
    );
  } catch (error) {
    console.error("[Extension API] Error:", error);
    return jsonError("Failed to save bookmark", "Server Error", 500, headers);
  }
}

export const Route = createFileRoute("/api/extension/bookmark")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => handleOptions(request, getAllowedOrigins()),
      POST: ({ request }) => handlePost(request),
    },
  },
});
