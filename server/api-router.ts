import { os, ORPCError } from "@orpc/server";
import * as z from "zod";
import { apiAuthed } from "./api-context";
import { db } from "@/lib/db";
import { normalizeUrl, canonicalizeUrl } from "@/lib/utils";
import { getUrlMetadata } from "@/lib/url-metadata";

/**
 * Health check endpoint — no auth required.
 * GET /api/health → { success: true, message: "ok" }
 */
const health = os
  .route({ method: "GET", path: "/health" })
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  )
  .handler(async () => {
    return { success: true, message: "ok" };
  });

// ---------------------------------------------------------------------------
// Bookmark API endpoints
// ---------------------------------------------------------------------------

const bookmarkItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().nullable(),
  favicon: z.string().nullable(),
  type: z.string(),
  color: z.string().nullable(),
  isPublic: z.boolean().nullable(),
  groupId: z.string(),
  createdAt: z.string(),
});

/**
 * GET /api/bookmarks — List bookmarks (paginated)
 */
const listBookmarks = apiAuthed
  .route({ method: "GET", path: "/bookmarks" })
  .input(
    z.object({
      limit: z.coerce.number().int().min(1).max(1000).default(25),
      offset: z.coerce.number().int().min(0).default(0),
      search: z.string().optional(),
      sort: z.enum(["newest", "oldest"]).default("newest"),
      groupId: z.string().optional(),
    }),
  )
  .output(
    z.object({
      success: z.boolean(),
      bookmarks: z.array(bookmarkItemSchema),
      total: z.number(),
    }),
  )
  .handler(async ({ context, input }) => {
    const where: Record<string, unknown> = {
      userId: context.user.id,
    };

    if (input.groupId) {
      where.groupId = input.groupId;
    }

    if (input.search) {
      where.OR = [
        { title: { contains: input.search } },
        { url: { contains: input.search } },
      ];
    }

    const [bookmarks, total] = await Promise.all([
      db.bookmark.findMany({
        where,
        orderBy: {
          createdAt: input.sort === "newest" ? "desc" : "asc",
        },
        skip: input.offset,
        take: input.limit,
      }),
      db.bookmark.count({ where }),
    ]);

    return {
      success: true,
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        title: b.title,
        url: b.url,
        favicon: b.favicon,
        type: b.type,
        color: b.color ?? null,
        isPublic: b.isPublic ?? null,
        groupId: b.groupId,
        createdAt: b.createdAt.toISOString(),
      })),
      total,
    };
  });

/**
 * POST /api/bookmarks — Create a bookmark
 */
const createBookmark = apiAuthed
  .route({ method: "POST", path: "/bookmarks", successStatus: 201 })
  .input(
    z.object({
      url: z.string().min(1, "url is required"),
      title: z.string().optional(),
      groupId: z.string().optional(),
    }),
  )
  .output(
    z.object({
      success: z.boolean(),
      bookmarkId: z.string(),
      duplicate: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    // Resolve groupId: validate if provided, otherwise use user's first group
    let resolvedGroupId: string;

    if (input.groupId) {
      const group = await db.group.findFirst({
        where: { id: input.groupId, userId: context.user.id },
        select: { id: true },
      });
      if (!group) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Group not found",
        });
      }
      resolvedGroupId = group.id;
    } else {
      // No groupId provided — use the user's first group or create a default one
      const firstGroup = await db.group.findFirst({
        where: { userId: context.user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (firstGroup) {
        resolvedGroupId = firstGroup.id;
      } else {
        // Create a default group for the user
        const defaultGroup = await db.group.create({
          data: {
            name: "Bookmarks",
            color: "#737373",
            userId: context.user.id,
          },
        });
        resolvedGroupId = defaultGroup.id;
      }
    }

    const normalized = normalizeUrl(input.url);
    const canonical = canonicalizeUrl(normalized);

    // Check for duplicate by normalizedUrl across all of user's bookmarks
    const existing = await db.bookmark.findFirst({
      where: {
        userId: context.user.id,
        normalizedUrl: canonical,
      },
      select: { id: true },
    });

    if (existing) {
      return {
        success: true,
        bookmarkId: existing.id,
        duplicate: true,
      };
    }

    // Fetch metadata for the URL
    const metadata = await getUrlMetadata(normalized);

    const bookmark = await db.bookmark.create({
      data: {
        title: input.title || metadata.title || normalized,
        url: normalized,
        normalizedUrl: canonical,
        favicon: metadata.favicon,
        type: "link",
        groupId: resolvedGroupId,
        userId: context.user.id,
      },
    });

    return {
      success: true,
      bookmarkId: bookmark.id,
    };
  });

/**
 * PATCH /api/bookmarks/{id} — Update a bookmark
 */
const updateBookmark = apiAuthed
  .route({ method: "PATCH", path: "/bookmarks/{id}" })
  .input(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      url: z.string().optional(),
      groupId: z.string().nullable().optional(),
      isPublic: z.boolean().nullable().optional(),
    }),
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
      bookmarkId: z.string(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { id, ...fields } = input;

    // Check bookmark exists and belongs to user
    const existing = await db.bookmark.findFirst({
      where: { id, userId: context.user.id },
      select: { id: true },
    });

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Bookmark not found",
      });
    }

    // Validate groupId if provided (non-null)
    if (fields.groupId !== undefined && fields.groupId !== null) {
      const group = await db.group.findFirst({
        where: { id: fields.groupId, userId: context.user.id },
        select: { id: true },
      });
      if (!group) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Group not found",
        });
      }
    }

    const updateData: Record<string, unknown> = {};

    if (fields.title !== undefined) updateData.title = fields.title;
    if (fields.url !== undefined) {
      const normalized = normalizeUrl(fields.url);
      updateData.url = normalized;
      updateData.normalizedUrl = canonicalizeUrl(normalized);
    }
    if (fields.groupId !== undefined) {
      updateData.groupId = fields.groupId;
      // Reset public status when moving groups
      if (fields.isPublic === undefined) {
        updateData.isPublic = null;
      }
    }
    if (fields.isPublic !== undefined) updateData.isPublic = fields.isPublic;

    await db.bookmark.update({
      where: { id, userId: context.user.id },
      data: updateData,
    });

    return {
      success: true,
      message: "Bookmark updated",
      bookmarkId: id,
    };
  });

/**
 * DELETE /api/bookmarks/{id} — Delete a bookmark
 */
const deleteBookmark = apiAuthed
  .route({ method: "DELETE", path: "/bookmarks/{id}" })
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
      bookmarkId: z.string(),
    }),
  )
  .handler(async ({ context, input }) => {
    // Check bookmark exists and belongs to user
    const existing = await db.bookmark.findFirst({
      where: { id: input.id, userId: context.user.id },
      select: { id: true },
    });

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Bookmark not found",
      });
    }

    await db.bookmark.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: "Bookmark deleted",
      bookmarkId: input.id,
    };
  });

// ---------------------------------------------------------------------------
// Group API endpoints
// ---------------------------------------------------------------------------

const groupItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  isPublic: z.boolean(),
  bookmarkCount: z.number(),
  createdAt: z.string(),
});

/**
 * GET /api/groups — List groups for the authenticated user
 */
const listGroups = apiAuthed
  .route({ method: "GET", path: "/groups" })
  .output(
    z.object({
      success: z.boolean(),
      groups: z.array(groupItemSchema),
    }),
  )
  .handler(async ({ context }) => {
    const groups = await db.group.findMany({
      where: { userId: context.user.id },
      include: { _count: { select: { bookmarks: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        color: g.color,
        isPublic: g.isPublic,
        bookmarkCount: g._count.bookmarks,
        createdAt: g.createdAt.toISOString(),
      })),
    };
  });

/**
 * POST /api/groups — Create a new group
 */
const createGroup = apiAuthed
  .route({ method: "POST", path: "/groups", successStatus: 201 })
  .input(
    z.object({
      name: z.string().min(1, "name is required"),
      color: z.string().min(1, "color is required"),
    }),
  )
  .output(
    z.object({
      success: z.boolean(),
      groupId: z.string(),
    }),
  )
  .handler(async ({ context, input }) => {
    const group = await db.group.create({
      data: {
        name: input.name,
        color: input.color,
        userId: context.user.id,
      },
    });

    return {
      success: true,
      groupId: group.id,
    };
  });

/**
 * PATCH /api/groups/{id} — Update a group
 */
const updateGroup = apiAuthed
  .route({ method: "PATCH", path: "/groups/{id}" })
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      color: z.string().optional(),
      isPublic: z.boolean().optional(),
    }),
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
      groupId: z.string(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { id, ...fields } = input;

    const existing = await db.group.findFirst({
      where: { id, userId: context.user.id },
      select: { id: true },
    });

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Group not found",
      });
    }

    const updateData: Record<string, unknown> = {};

    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.color !== undefined) updateData.color = fields.color;
    if (fields.isPublic !== undefined) updateData.isPublic = fields.isPublic;

    await db.group.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: "Group updated",
      groupId: id,
    };
  });

/**
 * DELETE /api/groups/{id} — Delete a group (cascades to bookmarks)
 */
const deleteGroup = apiAuthed
  .route({ method: "DELETE", path: "/groups/{id}" })
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
      groupId: z.string(),
    }),
  )
  .handler(async ({ context, input }) => {
    const existing = await db.group.findFirst({
      where: { id: input.id, userId: context.user.id },
      select: { id: true },
    });

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Group not found",
      });
    }

    await db.group.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: "Group deleted",
      groupId: input.id,
    };
  });

// ---------------------------------------------------------------------------
// User API endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/user/me — Get authenticated user profile
 */
const getMe = apiAuthed
  .route({ method: "GET", path: "/user/me" })
  .output(
    z.object({
      success: z.boolean(),
      user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        username: z.string().nullable(),
        image: z.string().nullable(),
        createdAt: z.string(),
      }),
    }),
  )
  .handler(async ({ context }) => {
    return {
      success: true,
      user: {
        id: context.user.id,
        name: context.user.name,
        email: context.user.email,
        username: context.user.username ?? null,
        image: context.user.image ?? null,
        createdAt: context.user.createdAt.toISOString(),
      },
    };
  });

/**
 * Public API router — holds all REST API route definitions.
 * Uses OpenAPIHandler to serve these as REST endpoints at /api/*.
 */
export const apiRouter = {
  health,
  listBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getMe,
};

export type ApiRouter = typeof apiRouter;
