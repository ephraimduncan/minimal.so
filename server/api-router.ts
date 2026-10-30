import { os, ORPCError } from "@orpc/server";
import * as z from "zod";
import { and, asc, count, desc, eq, or, sql } from "drizzle-orm";
import { apiAuthed } from "./api-context";
import { bookmark, group } from "@/lib/db/schema";
import { MAX_URL_LENGTH } from "@/lib/schema";
import { normalizeUrl, canonicalizeUrl } from "@/lib/utils";
import { getUrlMetadata } from "@/lib/url-metadata";

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
    const { db } = context;
    const conditions = and(
      eq(bookmark.userId, context.user.id),
      input.groupId ? eq(bookmark.groupId, input.groupId) : undefined,
      // D1 rejects LIKE patterns longer than 50 bytes, so search with instr.
      input.search
        ? or(
            sql`instr(lower(${bookmark.title}), lower(${input.search})) > 0`,
            sql`instr(lower(${bookmark.url}), lower(${input.search})) > 0`,
          )
        : undefined,
    );

    const [bookmarks, total] = await Promise.all([
      db
        .select()
        .from(bookmark)
        .where(conditions)
        .orderBy(
          input.sort === "newest"
            ? desc(bookmark.createdAt)
            : asc(bookmark.createdAt),
        )
        .limit(input.limit)
        .offset(input.offset),
      db.$count(bookmark, conditions),
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

const createBookmark = apiAuthed
  .route({ method: "POST", path: "/bookmarks" })
  .input(
    z.object({
      url: z.string().min(1, "url is required").max(MAX_URL_LENGTH),
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
    const { db } = context;
    let resolvedGroupId: string;

    if (input.groupId) {
      const [owned] = await db
        .select({ id: group.id })
        .from(group)
        .where(and(eq(group.id, input.groupId), eq(group.userId, context.user.id)))
        .limit(1);
      if (!owned) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Group not found",
        });
      }
      resolvedGroupId = owned.id;
    } else {
      const [firstGroup] = await db
        .select({ id: group.id })
        .from(group)
        .where(eq(group.userId, context.user.id))
        .orderBy(asc(group.createdAt))
        .limit(1);

      if (firstGroup) {
        resolvedGroupId = firstGroup.id;
      } else {
        const [defaultGroup] = await db
          .insert(group)
          .values({
            name: "Bookmarks",
            color: "#737373",
            userId: context.user.id,
          })
          .returning({ id: group.id });
        resolvedGroupId = defaultGroup.id;
      }
    }

    const normalized = normalizeUrl(input.url);
    const canonical = canonicalizeUrl(normalized);

    const metadata = await getUrlMetadata(normalized);
    const sameUrl = and(
      eq(bookmark.userId, context.user.id),
      eq(bookmark.normalizedUrl, canonical),
    );

    // D1 has no interactive transactions. One INSERT ... WHERE NOT EXISTS
    // keeps two concurrent requests from saving the same URL twice.
    const now = sql.param(new Date(), bookmark.createdAt);
    const [created] = await db.all<{ id: string }>(sql`
      insert into ${bookmark} ("id", "title", "url", "normalizedUrl", "favicon", "type", "groupId", "userId", "createdAt", "updatedAt")
      select ${crypto.randomUUID()}, ${input.title || metadata.title || normalized}, ${normalized}, ${canonical}, ${metadata.favicon}, 'link', ${resolvedGroupId}, ${context.user.id}, ${now}, ${now}
      where not exists (select 1 from ${bookmark} where ${sameUrl})
      returning "id"`);

    if (created) {
      return { success: true, bookmarkId: created.id };
    }

    const [existing] = await db
      .select({ id: bookmark.id })
      .from(bookmark)
      .where(sameUrl)
      .limit(1);

    // The matching bookmark was deleted between the two queries.
    if (!existing) {
      throw new ORPCError("CONFLICT", { message: "Bookmark changed, try again" });
    }

    return { success: true, bookmarkId: existing.id, duplicate: true };
  });

const updateBookmark = apiAuthed
  .route({ method: "PATCH", path: "/bookmarks/{id}" })
  .input(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      url: z.string().min(1).max(MAX_URL_LENGTH).optional(),
      groupId: z.string().optional(),
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
    const { db } = context;
    const { id, ...fields } = input;

    const [existing] = await db
      .select({ id: bookmark.id, groupId: bookmark.groupId })
      .from(bookmark)
      .where(and(eq(bookmark.id, id), eq(bookmark.userId, context.user.id)))
      .limit(1);

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Bookmark not found",
      });
    }

    if (fields.groupId !== undefined) {
      const [owned] = await db
        .select({ id: group.id })
        .from(group)
        .where(
          and(eq(group.id, fields.groupId), eq(group.userId, context.user.id)),
        )
        .limit(1);
      if (!owned) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Group not found",
        });
      }
    }

    const updateData: Partial<typeof bookmark.$inferInsert> = {};

    if (fields.title !== undefined) updateData.title = fields.title;
    if (fields.url !== undefined) {
      const normalized = normalizeUrl(fields.url);
      updateData.url = normalized;
      updateData.normalizedUrl = canonicalizeUrl(normalized);
    }
    if (fields.groupId !== undefined) {
      updateData.groupId = fields.groupId;
      if (fields.isPublic === undefined && existing.groupId !== fields.groupId) {
        updateData.isPublic = null;
      }
    }
    if (fields.isPublic !== undefined) updateData.isPublic = fields.isPublic;

    await db
      .update(bookmark)
      .set(updateData)
      .where(and(eq(bookmark.id, id), eq(bookmark.userId, context.user.id)));

    return {
      success: true,
      message: "Bookmark updated",
      bookmarkId: id,
    };
  });

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
    const { db } = context;
    const [existing] = await db
      .select({ id: bookmark.id })
      .from(bookmark)
      .where(and(eq(bookmark.id, input.id), eq(bookmark.userId, context.user.id)))
      .limit(1);

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Bookmark not found",
      });
    }

    await db
      .delete(bookmark)
      .where(and(eq(bookmark.id, input.id), eq(bookmark.userId, context.user.id)));

    return {
      success: true,
      message: "Bookmark deleted",
      bookmarkId: input.id,
    };
  });
const groupItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  isPublic: z.boolean(),
  bookmarkCount: z.number(),
  createdAt: z.string(),
});

const listGroups = apiAuthed
  .route({ method: "GET", path: "/groups" })
  .output(
    z.object({
      success: z.boolean(),
      groups: z.array(groupItemSchema),
    }),
  )
  .handler(async ({ context }) => {
    const groups = await context.db
      .select({
        id: group.id,
        name: group.name,
        color: group.color,
        isPublic: group.isPublic,
        createdAt: group.createdAt,
        bookmarkCount: count(bookmark.id),
      })
      .from(group)
      .leftJoin(bookmark, eq(bookmark.groupId, group.id))
      .where(eq(group.userId, context.user.id))
      .groupBy(group.id)
      .orderBy(desc(group.createdAt));

    return {
      success: true,
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        color: g.color,
        isPublic: g.isPublic,
        bookmarkCount: g.bookmarkCount,
        createdAt: g.createdAt.toISOString(),
      })),
    };
  });

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
    const [created] = await context.db
      .insert(group)
      .values({
        name: input.name,
        color: input.color,
        userId: context.user.id,
      })
      .returning({ id: group.id });

    return {
      success: true,
      groupId: created.id,
    };
  });

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
    const { db } = context;
    const { id, ...fields } = input;

    const [existing] = await db
      .select({ id: group.id })
      .from(group)
      .where(and(eq(group.id, id), eq(group.userId, context.user.id)))
      .limit(1);

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Group not found",
      });
    }

    const updateData: Partial<typeof group.$inferInsert> = {};

    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.color !== undefined) updateData.color = fields.color;
    if (fields.isPublic !== undefined) updateData.isPublic = fields.isPublic;

    await db
      .update(group)
      .set(updateData)
      .where(and(eq(group.id, id), eq(group.userId, context.user.id)));

    return {
      success: true,
      message: "Group updated",
      groupId: id,
    };
  });

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
      deletedBookmarkCount: z.number(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { db } = context;
    const [existing] = await db
      .select({ id: group.id })
      .from(group)
      .where(and(eq(group.id, input.id), eq(group.userId, context.user.id)))
      .limit(1);

    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Group not found",
      });
    }

    const deletedBookmarkCount = await db.$count(
      bookmark,
      and(eq(bookmark.groupId, input.id), eq(bookmark.userId, context.user.id)),
    );

    await db
      .delete(group)
      .where(and(eq(group.id, input.id), eq(group.userId, context.user.id)));

    return {
      success: true,
      message: "Group deleted",
      groupId: input.id,
      deletedBookmarkCount,
    };
  });

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
        bio: z.string().nullable(),
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
        bio: context.user.bio ?? null,
        image: context.user.image ?? null,
        createdAt: context.user.createdAt.toISOString(),
      },
    };
  });

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
