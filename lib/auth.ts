import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CHROME_EXTENSION_ID } =
  process.env;
const googleOAuthEnabled = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

async function ensureDefaultGroup(userId: string): Promise<void> {
  const existingGroups = await db.group.count({ where: { userId } });
  if (existingGroups > 0) return;

  await db.group.create({
    data: { name: "Bookmarks", color: "#74B06F", userId },
  });
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "sqlite" }),
  trustedOrigins: CHROME_EXTENSION_ID
    ? [`chrome-extension://${CHROME_EXTENSION_ID}`]
    : [],
  emailAndPassword: { enabled: true },
  ...(googleOAuthEnabled && {
    socialProviders: {
      google: {
        clientId: GOOGLE_CLIENT_ID!,
        clientSecret: GOOGLE_CLIENT_SECRET!,
      },
    },
  }),
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.context.newSession) {
        await ensureDefaultGroup(ctx.context.newSession.user.id);
      }
    }),
  },
});
