import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { posthogServer } from "@/lib/posthog-server";
import { db } from "@/lib/db";
import { getUrlMetadata, isArxivHost } from "@/lib/url-metadata";
import { canonicalizeUrl, normalizeUrl } from "@/lib/utils";
import {
  FREE_BOOKMARK_LIMIT,
  FREE_GROUP_LIMIT,
  hasActiveProAccess,
} from "@/lib/plan-limits";
import { z } from "zod";
import {
  getAllowedOrigins,
  corsHeaders,
  jsonError,
  handleOptions,
} from "../shared";

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
  url: z.url(),
  title: z.string().optional(),
  source: sourceEnum.optional(),
  destinationGroup: z.string().optional(),
  capturedAt: z.string().datetime().optional(),
});

const allowedOrigins = getAllowedOrigins();

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
  userId: string,
  source: string | undefined,
  destinationGroupName: string | undefined,
  isPro: boolean,
): Promise<{ id: string; name: string }> {
  const importGroupName =
    destinationGroupName || (source ? IMPORT_GROUP_MAP[source] : undefined);

  if (importGroupName) {
    const existing = await db.group.findFirst({
      where: { userId, name: importGroupName },
      select: { id: true, name: true },
    });
    if (existing) return existing;

    if (!isPro) {
      const groupCount = await db.group.count({ where: { userId } });
      if (groupCount >= FREE_GROUP_LIMIT) {
        throw new Error("GROUP_LIMIT");
      }
    }

    const created = await db.group.create({
      data: {
        name: importGroupName,
        color: IMPORT_GROUP_COLOR,
        userId,
      },
    });
    return { id: created.id, name: created.name };
  }

  const defaultGroup = await db.group.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (!defaultGroup) {
    throw new Error("NO_GROUP");
  }

  return defaultGroup;
}

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
      posthogServer?.capture({
        distinctId: "anonymous",
        event: "extension_auth_failed",
      });
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

    const { url, title: providedTitle, source, destinationGroup, capturedAt } =
      parsed.data;

    const userId = session.user.id;
    const normalized = canonicalizeUrl(url);
    const eventTime = capturedAt ? new Date(capturedAt) : new Date();

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true, subscriptionStatus: true },
    });
    const isPro = hasActiveProAccess(user?.plan, user?.subscriptionStatus);

    let targetGroup: { id: string; name: string };
    try {
      targetGroup = await resolveDestinationGroup(
        userId,
        source,
        destinationGroup,
        isPro,
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
      if (err instanceof Error && err.message === "GROUP_LIMIT") {
        return jsonError(
          "Free plan group limit reached. Upgrade to create more groups.",
          "Forbidden",
          403,
          headers,
        );
      }
      throw err;
    }

    const existing = await db.bookmark.findFirst({
      where: { userId, normalizedUrl: normalized },
    });

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

      const updateData: Record<string, unknown> = {
        title: metadata.title || existing.title,
        favicon: metadata.favicon || existing.favicon,
        updatedAt: new Date(),
        sourceHistory: JSON.stringify(updatedHistory),
      };

      if (reclassify) {
        updateData.primarySource = source;
        updateData.lastCapturedAt = eventTime;
        updateData.groupId = targetGroup.id;
      }

      const bookmark = await db.bookmark.update({
        where: { id: existing.id, userId },
        data: updateData,
      });

      posthogServer?.capture({
        distinctId: session.user.id,
        event: "extension_bookmark_saved",
      });

      return NextResponse.json(
        {
          success: true,
          action: reclassify ? "reclassified" : "updated",
          bookmark: {
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            groupName: targetGroup.name,
          },
        },
        { status: 200, headers },
      );
    }

    if (!isPro) {
      const bookmarkCount = await db.bookmark.count({ where: { userId } });
      if (bookmarkCount >= FREE_BOOKMARK_LIMIT) {
        return jsonError(
          "Free plan bookmark limit reached. Upgrade to save more bookmarks.",
          "Forbidden",
          403,
          headers,
        );
      }
    }

    const metadata = await metadataPromise;
    const title = isArxivHost(normalizeUrl(url))
      ? metadata.title || providedTitle || normalized
      : providedTitle || metadata.title || normalized;

    const sourceHistory = source ? [source] : [];

    const bookmark = await db.bookmark.create({
      data: {
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
      },
    });

    posthogServer?.capture({
      distinctId: session.user.id,
      event: "extension_bookmark_saved",
    });

    return NextResponse.json(
      {
        success: true,
        action: "created",
        bookmark: {
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          groupName: targetGroup.name,
        },
      },
      { status: 200, headers },
    );
  } catch (error) {
    console.error("[Extension API] Error:", error);
    posthogServer?.capture({
      distinctId: "anonymous",
      event: "extension_save_failed",
    });
    return jsonError("Failed to save bookmark", "Server Error", 500, headers);
  }
}
