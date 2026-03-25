import { ORPCError, os } from "@orpc/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { hasActiveProAccess } from "@/lib/plan-limits";
import { hashApiKey } from "@/lib/api-key-hash";


export const apiBase = os.use(async ({ next }) => {
  const headersList = await headers();
  const authorization = headersList.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Invalid API key",
    });
  }

  const token = authorization.slice(7);

  const keyHash = hashApiKey(token);

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKey) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Invalid API key",
    });
  }

  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  if (!hasActiveProAccess(apiKey.user.plan, apiKey.user.subscriptionStatus, apiKey.user.subscriptionCurrentPeriodEnd)) {
    throw new ORPCError("FORBIDDEN", {
      message: "API access requires an active Pro subscription",
    });
  }

  return next({
    context: {
      user: apiKey.user,
      apiKeyId: apiKey.id,
    },
  });
});

export const apiAuthed = apiBase;
