import { authed } from "../context";
import { db } from "@/lib/db";
import {
  listBookmarksInputSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
  deleteByIdSchema,
  createGroupSchema,
  updateGroupSchema,
} from "@/lib/schema";
import { getUrlMetadata } from "@/lib/url-metadata";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";

export const listBookmarks = authed
  .input(listBookmarksInputSchema)
  .handler(async ({ context, input }) => {
    const bookmarks = await db.bookmark.findMany({
      where: {
        userId: context.user.id,
        ...(input.groupId && { groupId: input.groupId }),
      },
      orderBy: { updatedAt: "desc" },
    });
    return bookmarks;
  });

export const createBookmark = authed
  .input(createBookmarkSchema)
  .handler(async ({ context, input }) => {
    let title = input.title;
    let favicon: string | null = null;
    let url = input.url || null;

    if (input.type === "link" && input.url) {
      const normalizedUrl = normalizeUrl(input.url);
      url = normalizedUrl;

      const existing = await db.bookmark.findFirst({
        where: {
          userId: context.user.id,
          groupId: input.groupId,
          url: normalizedUrl,
        },
      });

      if (existing) {
        const metadata = await getUrlMetadata(normalizedUrl);
        const bookmark = await db.bookmark.update({
          where: { id: existing.id },
          data: {
            title: metadata.title || existing.title,
            favicon: metadata.favicon || existing.favicon,
            updatedAt: new Date(),
          },
        });
        return bookmark;
      }

      const metadata = await getUrlMetadata(normalizedUrl);
      if (metadata.title) {
        title = metadata.title;
      }
      favicon = metadata.favicon;
    }

    const bookmark = await db.bookmark.create({
      data: {
        title,
        url,
        favicon,
        type: input.type,
        color: input.color,
        groupId: input.groupId,
        userId: context.user.id,
      },
    });
    return bookmark;
  });

export const updateBookmark = authed
  .input(updateBookmarkSchema)
  .handler(async ({ context, input }) => {
    const { id, ...data } = input;
    const bookmark = await db.bookmark.update({
      where: { id, userId: context.user.id },
      data,
    });
    return bookmark;
  });

export const deleteBookmark = authed
  .input(deleteByIdSchema)
  .handler(async ({ context, input }) => {
    await db.bookmark.deleteMany({
      where: { id: input.id, userId: context.user.id },
    });
    return { success: true };
  });

export const listGroups = authed.handler(async ({ context }) => {
  const groups = await db.group.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { bookmarks: true },
      },
    },
  });
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    color: g.color,
    bookmarkCount: g._count.bookmarks,
  }));
});

export const createGroup = authed
  .input(createGroupSchema)
  .handler(async ({ context, input }) => {
    const group = await db.group.create({
      data: {
        ...input,
        userId: context.user.id,
      },
    });
    return group;
  });

export const updateGroup = authed
  .input(updateGroupSchema)
  .handler(async ({ context, input }) => {
    const { id, ...data } = input;
    const group = await db.group.update({
      where: { id, userId: context.user.id },
      data,
    });
    return group;
  });

export const deleteGroup = authed
  .input(deleteByIdSchema)
  .handler(async ({ context, input }) => {
    await db.group.deleteMany({
      where: { id: input.id, userId: context.user.id },
    });
    return { success: true };
  });

export const refetchBookmark = authed
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    const existing = await db.bookmark.findFirst({
      where: { id: input.id, userId: context.user.id },
    });

    if (!existing || !existing.url) {
      throw new Error("Bookmark not found or has no URL");
    }

    const metadata = await getUrlMetadata(existing.url);

    const bookmark = await db.bookmark.update({
      where: { id: input.id, userId: context.user.id },
      data: {
        title: metadata.title || existing.title,
        favicon: metadata.favicon,
      },
    });

    return bookmark;
  });
