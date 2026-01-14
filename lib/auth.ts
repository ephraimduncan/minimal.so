import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const googleOAuthEnabled = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

const extensionId = process.env.CHROME_EXTENSION_ID;

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, {
    provider: "sqlite",
  }),
  trustedOrigins: extensionId ? [`chrome-extension://${extensionId}`] : [],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: googleOAuthEnabled
    ? {
        google: {
          clientId: GOOGLE_CLIENT_ID!,
          clientSecret: GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.context.newSession) {
        const userId = ctx.context.newSession.user.id;
        const existingGroups = await db.group.count({
          where: { userId },
        });
        if (existingGroups === 0) {
          await db.group.create({
            data: {
              name: "Bookmarks",
              color: "#74B06F",
              userId,
            },
          });
        }
      }
    }),
  },
});
