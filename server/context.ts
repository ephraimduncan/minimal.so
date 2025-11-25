import { ORPCError, os } from "@orpc/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/schema";

export const base = os.use(async ({ next }) => {
  const headersList = await headers();
  const session = (await auth.api.getSession({
    headers: headersList,
  })) as Session;

  return next({
    context: {
      session,
      user: session?.user ?? null,
    },
  });
});

export const authed = base.use(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({
    context: {
      ...context,
      user: context.user,
    },
  });
});
