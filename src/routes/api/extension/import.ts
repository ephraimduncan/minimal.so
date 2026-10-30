import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { createDb } from "@/lib/db";
import { bookmark, group, user } from "@/lib/db/schema";
import { MAX_URL_LENGTH } from "@/lib/schema";
import { normalizeUrl } from "@/lib/utils";
import { hasActiveProAccess } from "@/lib/plan-limits";
import {
  getAllowedOrigins,
  corsHeaders,
  jsonError,
  handleOptions,
} from "@/lib/extension-cors";

const IMPORT_LIMIT = 2000;
// Each row binds 8 values, and D1 allows 100 per query.
const CHUNK_SIZE = 12;
const IMPORTED_GROUP_NAME = "Imported - Browser";
const IMPORTED_GROUP_COLOR = "#6366f1";

const importBookmarkSchema = z.object({
  title: z.string(),
  url: z.string(),
});

const importRequestSchema = z.object({
  bookmarks: z.array(importBookmarkSchema),
});

async function handlePost(request: Request): Promise<Response> {
  const startTime = Date.now();
  const allowedOrigins = getAllowedOrigins({ includeWebOrigin: true });
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
        headers,
      );
    }

    const db = createDb();
    const [account] = await db
      .select({
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (
      !hasActiveProAccess(
        account?.plan,
        account?.subscriptionStatus,
        account?.subscriptionCurrentPeriodEnd,
      )
    ) {
      return jsonError(
        "Import is available on Pro only. Upgrade to continue.",
        "Forbidden",
        403,
        headers,
      );
    }

    const body = await request.json();
    const parsed = importRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        "Invalid payload. Expected { bookmarks: Array<{ title, url }> }",
        "Bad Request",
        400,
        headers,
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
        if (
          (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
          normalized.length > MAX_URL_LENGTH
        ) {
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

    let [importGroup] = await db
      .select({ id: group.id })
      .from(group)
      .where(and(eq(group.userId, userId), eq(group.name, IMPORTED_GROUP_NAME)))
      .limit(1);

    if (!importGroup) {
      [importGroup] = await db
        .insert(group)
        .values({
          name: IMPORTED_GROUP_NAME,
          color: IMPORTED_GROUP_COLOR,
          userId,
        })
        .returning({ id: group.id });
    }

    const existingBookmarks = await db
      .select({ url: bookmark.url })
      .from(bookmark)
      .where(and(eq(bookmark.userId, userId), eq(bookmark.groupId, importGroup.id)));
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

    const inserts = [];
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      inserts.push(
        db.insert(bookmark).values(
          toInsert.slice(i, i + CHUNK_SIZE).map((entry) => ({
            title: entry.title,
            url: entry.url,
            type: "link",
            groupId: importGroup.id,
            userId,
          })),
        ),
      );
    }

    const [first, ...rest] = inserts;
    if (first) {
      try {
        await db.batch([first, ...rest]);
        importedCount = toInsert.length;
      } catch (error) {
        console.error("[Import API] Insert failed:", error);
        errorSummary.chunkInsertFailed = toInsert.length;
      }
    }

    const skippedCount = capped.length - importedCount;
    const durationMs = Date.now() - startTime;

    console.log(
      `[Import API] userId=${userId} inputCount=${incoming.length} importedCount=${importedCount} skippedCount=${skippedCount} truncated=${truncated} durationMs=${durationMs}`,
    );

    const hasErrors = Object.keys(errorSummary).length > 0;

    return Response.json(
      {
        success: true,
        groupId: importGroup.id,
        groupName: IMPORTED_GROUP_NAME,
        importedCount,
        skippedCount,
        truncated,
        limit: IMPORT_LIMIT,
        ...(hasErrors && { errorSummary }),
      },
      { status: 200, headers },
    );
  } catch (error) {
    console.error("[Import API] Error:", error);
    return jsonError("Failed to import bookmarks", "Server Error", 500, headers);
  }
}

export const Route = createFileRoute("/api/extension/import")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => handleOptions(request, getAllowedOrigins({ includeWebOrigin: true })),
      POST: ({ request }) => handlePost(request),
    },
  },
});
