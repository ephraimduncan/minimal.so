import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { hasActiveProAccess } from "@/lib/plan-limits";
import { authed } from "../context";
import { hashApiKey } from "@/lib/api-key-hash";
import { apiKey, user } from "@/lib/db/schema";

function generateRawKey(): string {
  const token = randomBytes(20).toString("hex"); // 40 hex chars
  return `mnk_${token}`;
}

export const generateApiKey = authed.handler(async ({ context }) => {
  const { db } = context;
  const [account] = await db
    .select({
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
    })
    .from(user)
    .where(eq(user.id, context.user.id))
    .limit(1);

  if (
    !hasActiveProAccess(
      account?.plan,
      account?.subscriptionStatus,
      account?.subscriptionCurrentPeriodEnd,
    )
  ) {
    throw new ORPCError("FORBIDDEN", {
      message: "API key generation requires an active Pro subscription",
    });
  }

  const rawKey = generateRawKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 8); // "mnk_xxxx"

  await db.batch([
    db.delete(apiKey).where(eq(apiKey.userId, context.user.id)),
    db.insert(apiKey).values({
      keyHash,
      keyPrefix,
      userId: context.user.id,
    }),
  ]);

  return { key: rawKey };
});

export const revokeApiKey = authed.handler(async ({ context }) => {
  await context.db.delete(apiKey).where(eq(apiKey.userId, context.user.id));
  return { success: true };
});

export const getApiKey = authed.handler(async ({ context }) => {
  const [key] = await context.db
    .select({
      keyPrefix: apiKey.keyPrefix,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
    })
    .from(apiKey)
    .where(eq(apiKey.userId, context.user.id))
    .limit(1);

  return key ?? null;
});
