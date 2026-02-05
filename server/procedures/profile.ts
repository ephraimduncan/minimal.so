import { authed } from "../context";
import { db } from "@/lib/db";
import { updateProfileSchema, usernameSchema } from "@/lib/schema";
import { z } from "zod";
import { ORPCError } from "@orpc/server";

export const getProfile = authed.handler(async ({ context }) => {
  const user = await db.user.findUniqueOrThrow({
    where: { id: context.user.id },
    select: {
      username: true,
      bio: true,
      github: true,
      twitter: true,
      website: true,
      isProfilePublic: true,
    },
  });
  return user;
});

export const updateProfile = authed
  .input(updateProfileSchema)
  .handler(async ({ context, input }) => {
    const username = input.username?.toLowerCase() ?? null;

    if (username) {
      const existing = await db.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (existing && existing.id !== context.user.id) {
        throw new ORPCError("CONFLICT", { message: "Username is already taken" });
      }
    }

    const user = await db.user.update({
      where: { id: context.user.id },
      data: {
        username,
        bio: input.bio,
        github: input.github,
        twitter: input.twitter,
        website: input.website || null,
        isProfilePublic: input.isProfilePublic,
      },
      select: {
        username: true,
        bio: true,
        github: true,
        twitter: true,
        website: true,
        isProfilePublic: true,
      },
    });

    return user;
  });

export const checkUsername = authed
  .input(z.object({ username: usernameSchema }))
  .handler(async ({ context, input }) => {
    const username = input.username.toLowerCase();
    const existing = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });

    return { available: !existing || existing.id === context.user.id };
  });
