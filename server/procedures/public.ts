import { base } from "../context";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { getPublicProfileData } from "../queries/public-profile";

export const getPublicProfile = base
  .input(z.object({ username: z.string() }))
  .handler(async ({ input }) => {
    const data = await getPublicProfileData(input.username);

    if (!data) {
      throw new ORPCError("NOT_FOUND", { message: "User not found" });
    }

    const { user, groups, bookmarks } = data;

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
