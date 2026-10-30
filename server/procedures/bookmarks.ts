import { authed } from "../context";
import {
  listBookmarksInputSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
  deleteByIdSchema,
  createGroupSchema,
  updateGroupSchema,
  bulkDeleteBookmarksSchema,
  bulkMoveBookmarksSchema,
} from "@/lib/schema";
import { getUrlMetadata } from "@/lib/url-metadata";
import { normalizeUrl, canonicalizeUrl } from "@/lib/utils";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { inList, type DB } from "@/lib/db";
import { bookmark, group } from "@/lib/db/schema";

async function assertGroupOwnership(db: DB, groupId: string, userId: string) {
  const [found] = await db
    .select({ id: group.id })
    .from(group)
    .where(and(eq(group.id, groupId), eq(group.userId, userId)))
    .limit(1);
  if (!found) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }
}

export const listBookmarks = authed
  .input(listBookmarksInputSchema)
  .handler(async ({ context, input }) => {
    return context.db
      .select()
      .from(bookmark)
      .where(
        and(
          eq(bookmark.userId, context.user.id),
          input.groupId ? eq(bookmark.groupId, input.groupId) : undefined,
        ),
      )
      .orderBy(desc(bookmark.createdAt), desc(bookmark.id));
  });

export const createBookmark = authed
  .input(createBookmarkSchema)
  .handler(async ({ context, input }) => {
    const { db } = context;
    await assertGroupOwnership(db, input.groupId, context.user.id);
    let title = input.title;
    let favicon: string | null = null;
    let url = input.url || null;

    if (input.type === "link" && input.url) {
      const normalizedUrl = normalizeUrl(input.url);
      url = normalizedUrl;

      const [[existing], metadata] = await Promise.all([
        db
          .select()
          .from(bookmark)
          .where(
            and(
              eq(bookmark.userId, context.user.id),
              eq(bookmark.groupId, input.groupId),
              eq(bookmark.url, normalizedUrl),
            ),
          )
          .limit(1),
        getUrlMetadata(normalizedUrl),
      ]);

      if (existing) {
        const [updated] = await db
          .update(bookmark)
          .set({
            title: metadata.title || existing.title,
            favicon: metadata.favicon || existing.favicon,
            updatedAt: new Date(),
          })
          .where(
            and(eq(bookmark.id, existing.id), eq(bookmark.userId, context.user.id)),
          )
          .returning();
        return updated;
      }

      if (metadata.title) {
        title = metadata.title;
      }
      favicon = metadata.favicon;
    }

    const [created] = await db
      .insert(bookmark)
      .values({
        id: input.id,
        title,
        url,
        normalizedUrl: url ? canonicalizeUrl(url) : null,
        favicon,
        type: input.type,
        color: input.color,
        groupId: input.groupId,
        userId: context.user.id,
      })
      .returning();
    return created;
  });

export const updateBookmark = authed
  .input(updateBookmarkSchema)
  .handler(async ({ context, input }) => {
    const { db } = context;
    const { id, ...data } = input;
    const updateData: Partial<typeof bookmark.$inferInsert> = { ...data };

    if (data.groupId) {
      await assertGroupOwnership(db, data.groupId, context.user.id);
      const [existing] = await db
        .select({ groupId: bookmark.groupId })
        .from(bookmark)
        .where(and(eq(bookmark.id, id), eq(bookmark.userId, context.user.id)))
        .limit(1);
      if (existing && existing.groupId !== data.groupId) {
        updateData.isPublic = null;
      }
    }

    const [updated] = await db
      .update(bookmark)
      .set(updateData)
      .where(and(eq(bookmark.id, id), eq(bookmark.userId, context.user.id)))
      .returning();
    return updated;
  });

export const deleteBookmark = authed
  .input(deleteByIdSchema)
  .handler(async ({ context, input }) => {
    await context.db
      .delete(bookmark)
      .where(and(eq(bookmark.id, input.id), eq(bookmark.userId, context.user.id)));
    return { success: true };
  });

export const listGroups = authed.handler(async ({ context }) => {
  return context.db
    .select({
      id: group.id,
      name: group.name,
      color: group.color,
      isPublic: group.isPublic,
      bookmarkCount: count(bookmark.id),
    })
    .from(group)
    .leftJoin(bookmark, eq(bookmark.groupId, group.id))
    .where(eq(group.userId, context.user.id))
    .groupBy(group.id)
    .orderBy(asc(group.createdAt));
});

export const createGroup = authed
  .input(createGroupSchema)
  .handler(async ({ context, input }) => {
    const [created] = await context.db
      .insert(group)
      .values({ ...input, userId: context.user.id })
      .returning();
    return created;
  });

export const updateGroup = authed
  .input(updateGroupSchema)
  .handler(async ({ context, input }) => {
    const { id, ...data } = input;
    const [updated] = await context.db
      .update(group)
      .set(data)
      .where(and(eq(group.id, id), eq(group.userId, context.user.id)))
      .returning();
    return updated;
  });

export const deleteGroup = authed
  .input(deleteByIdSchema)
  .handler(async ({ context, input }) => {
    await context.db
      .delete(group)
      .where(and(eq(group.id, input.id), eq(group.userId, context.user.id)));
    return { success: true };
  });

export const refetchBookmark = authed
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    const { db } = context;
    const [existing] = await db
      .select()
      .from(bookmark)
      .where(and(eq(bookmark.id, input.id), eq(bookmark.userId, context.user.id)))
      .limit(1);

    if (!existing || !existing.url) {
      throw new ORPCError("NOT_FOUND", {
        message: "Bookmark not found or has no URL",
      });
    }

    const metadata = await getUrlMetadata(existing.url);

    const [updated] = await db
      .update(bookmark)
      .set({
        title: metadata.title || existing.title,
        favicon: metadata.favicon,
      })
      .where(and(eq(bookmark.id, input.id), eq(bookmark.userId, context.user.id)))
      .returning();

    return updated;
  });

export const bulkDeleteBookmarks = authed
  .input(bulkDeleteBookmarksSchema)
  .handler(async ({ context, input }) => {
    const deleted = await context.db
      .delete(bookmark)
      .where(
        and(inList(bookmark.id, input.ids), eq(bookmark.userId, context.user.id)),
      )
      .returning({ id: bookmark.id });
    return { success: true, count: deleted.length };
  });

export const bulkMoveBookmarks = authed
  .input(bulkMoveBookmarksSchema)
  .handler(async ({ context, input }) => {
    await assertGroupOwnership(context.db, input.targetGroupId, context.user.id);
    const moved = await context.db
      .update(bookmark)
      .set({
        groupId: input.targetGroupId,
        isPublic: null,
        updatedAt: new Date(),
      })
      .where(
        and(inList(bookmark.id, input.ids), eq(bookmark.userId, context.user.id)),
      )
      .returning({ id: bookmark.id });
    return { success: true, count: moved.length };
  });

export const setBookmarkVisibility = authed
  .input(z.object({ id: z.string(), isPublic: z.boolean().nullable() }))
  .handler(async ({ context, input }) => {
    const [updated] = await context.db
      .update(bookmark)
      .set({ isPublic: input.isPublic })
      .where(and(eq(bookmark.id, input.id), eq(bookmark.userId, context.user.id)))
      .returning();
    return updated;
  });

export const bulkSetVisibility = authed
  .input(
    z.object({
      ids: z.array(z.string()).min(1),
      isPublic: z.boolean().nullable(),
    }),
  )
  .handler(async ({ context, input }) => {
    const updated = await context.db
      .update(bookmark)
      .set({ isPublic: input.isPublic })
      .where(
        and(inList(bookmark.id, input.ids), eq(bookmark.userId, context.user.id)),
      )
      .returning({ id: bookmark.id });
    return { success: true, count: updated.length };
  });

export const setGroupVisibility = authed
  .input(z.object({ id: z.string(), isPublic: z.boolean() }))
  .handler(async ({ context, input }) => {
    const [updated] = await context.db
      .update(group)
      .set({ isPublic: input.isPublic })
      .where(and(eq(group.id, input.id), eq(group.userId, context.user.id)))
      .returning();
    return updated;
  });
