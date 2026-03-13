import { ORPCError, os } from "@orpc/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const apiBase = os.use(async ({ next }) => {
  const headersList = await headers();
  const authorization = headersList.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Invalid API key",
    });
  }

  const token = authorization.slice(7);

  if (!token) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Invalid API key",
    });
  }

  const keyHash = await hashToken(token);

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

  return next({
    context: {
      user: apiKey.user,
      apiKeyId: apiKey.id,
    },
  });
});

export const apiAuthed = apiBase.use(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Invalid API key",
    });
  }

  return next({
    context: {
      ...context,
      user: context.user,
    },
  });
});

export type ApiContext = {
  user: NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>;
  apiKeyId: string;
};
