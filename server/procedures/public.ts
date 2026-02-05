import { base } from "../context";
import { db } from "@/lib/db";
import { z } from "zod";
import { ORPCError } from "@orpc/server";

export const getPublicProfile = base
  .input(z.object({ username: z.string() }))
  .handler(async ({ input }) => {
    const username = input.username.toLowerCase();

    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        image: true,
        username: true,
        bio: true,
        github: true,
        twitter: true,
        website: true,
        isProfilePublic: true,
      },
    });

    if (!user) {
      throw new ORPCError("NOT_FOUND", { message: "User not found" });
    }

    if (!user.isProfilePublic) {
      throw new ORPCError("NOT_FOUND", { message: "Profile is not public" });
    }

    const groups = await db.group.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, color: true },
    });

    const publicGroupIds = groups.map((g) => g.id);

    const bookmarks = await db.bookmark.findMany({
      where: {
        userId: user.id,
        OR: [
          { groupId: { in: publicGroupIds }, isPublic: { not: false } },
          { isPublic: true },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        url: true,
        favicon: true,
        type: true,
        color: true,
        groupId: true,
        createdAt: true,
      },
    });

    return {
      user: {
        name: user.name,
        image: user.image,
        username: user.username,
        bio: user.bio,
        github: user.github,
        twitter: user.twitter,
        website: user.website,
      },
      groups,
      bookmarks,
    };
  });
