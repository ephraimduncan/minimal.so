import { cache } from "react";
import { db } from "@/lib/db";

const userSelect = {
  id: true,
  name: true,
  image: true,
  username: true,
  bio: true,
  github: true,
  twitter: true,
  website: true,
  isProfilePublic: true,
} as const;

const groupSelect = {
  id: true,
  name: true,
  color: true,
} as const;

const bookmarkSelect = {
  title: true,
  url: true,
  favicon: true,
  type: true,
  color: true,
  groupId: true,
  updatedAt: true,
} as const;

export const getPublicProfileData = cache(async (username: string) => {
  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: userSelect,
  });

  if (!user || !user.isProfilePublic) return null;

  const [groups, bookmarks] = await Promise.all([
    db.group.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { createdAt: "asc" },
      select: groupSelect,
    }),
    db.bookmark.findMany({
      where: {
        userId: user.id,
        OR: [
          { group: { isPublic: true } },
          { isPublic: true },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: bookmarkSelect,
    }),
  ]);

  const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

  return {
    user,
    groups: groups.map(({ id: _, ...rest }) => rest),
    bookmarks: bookmarks.map(({ groupId, ...rest }) => ({
      ...rest,
      groupName: groupNameById.get(groupId) ?? null,
    })),
  };
});
