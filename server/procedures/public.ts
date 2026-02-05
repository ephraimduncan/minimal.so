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
    const { id, isProfilePublic, ...userFields } = user;

    return { user: userFields, groups, bookmarks };
  });
