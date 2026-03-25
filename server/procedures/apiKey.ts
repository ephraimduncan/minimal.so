import { ORPCError } from "@orpc/server";
import { hasActiveProAccess } from "@/lib/plan-limits";
import { authed } from "../context";
import { db } from "@/lib/db";
import { hashApiKey } from "@/lib/api-key-hash";
import crypto from "crypto";

function generateRawKey(): string {
  const token = crypto.randomBytes(20).toString("hex"); // 40 hex chars
  return `mnk_${token}`;
}

export const generateApiKey = authed.handler(async ({ context }) => {
  const user = await db.user.findUnique({
    where: { id: context.user.id },
    select: { plan: true, subscriptionStatus: true, subscriptionCurrentPeriodEnd: true },
  });

  if (!hasActiveProAccess(user?.plan, user?.subscriptionStatus, user?.subscriptionCurrentPeriodEnd)) {
    throw new ORPCError("FORBIDDEN", {
      message: "API key generation requires an active Pro subscription",
    });
  }

  const rawKey = generateRawKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 8); // "mnk_xxxx"

  const result = await db.$transaction(async (tx) => {
    await tx.apiKey.deleteMany({ where: { userId: context.user.id } });
    await tx.apiKey.create({
      data: { keyHash, keyPrefix, userId: context.user.id },
    });
    return { key: rawKey };
  });

  return result;
});

export const revokeApiKey = authed.handler(async ({ context }) => {
  await db.apiKey.deleteMany({
    where: { userId: context.user.id },
  });

  return { success: true };
});

export const getApiKey = authed.handler(async ({ context }) => {
  const apiKey = await db.apiKey.findUnique({
    where: { userId: context.user.id },
    select: {
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return apiKey;
});
