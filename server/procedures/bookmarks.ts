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

export const listBookmarks = authed
  .input(listBookmarksInputSchema)
  .handler(async ({ context, input }) => {
    const bookmarks = await db.bookmark.findMany({
      where: {
        userId: context.user.id,
        ...(input.groupId && { groupId: input.groupId }),
      },
      orderBy: { createdAt: "desc" },
    });
    return bookmarks;
  });

export const createBookmark = authed
  .input(createBookmarkSchema)
  .handler(async ({ context, input }) => {
    const bookmark = await db.bookmark.create({
      data: {
        ...input,
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
    await db.bookmark.delete({
      where: { id: input.id, userId: context.user.id },
    });
    return { success: true };
  });

export const listGroups = authed.handler(async ({ context }) => {
  const groups = await db.group.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: "desc" },
  });
  return groups;
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
    await db.group.delete({
      where: { id: input.id, userId: context.user.id },
    });
    return { success: true };
  });

