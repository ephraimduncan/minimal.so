import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { APP_URL } from "./config";
import { posthogServer } from "./posthog-server";
import { sendEmail } from "./email";
import { welcomeEmail } from "./emails/welcome";
import { verificationEmail } from "./emails/verify-email";
import { resetPasswordEmail } from "./emails/reset-password";

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
  baseURL: APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "sqlite" }),
  trustedOrigins: CHROME_EXTENSION_ID
    ? [`chrome-extension://${CHROME_EXTENSION_ID}`]
    : [],
  plugins: [nextCookies()],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const result = await sendEmail({
        to: user.email,
        ...resetPasswordEmail(user.name, url),
      });

      if (!result.ok) {
        throw new Error("Failed to send password reset email");
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const result = await sendEmail({
        to: user.email,
        ...verificationEmail(user.name, url),
      });

      if (!result.ok) {
        throw new Error("Failed to send verification email");
      }
    },
  },
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
      const session = ctx.context.newSession;
      if (!session) return;

      await ensureDefaultGroup(session.user.id);

      const isNewUser =
        Date.now() - new Date(session.user.createdAt).getTime() < 60_000;
      if (isNewUser) {
        posthogServer?.capture({
          distinctId: session.user.id,
          event: "signup_completed",
        });
        const result = await sendEmail({
          to: session.user.email,
          ...welcomeEmail(session.user.name, APP_URL),
        });

        if (!result.ok) {
          console.error("[auth] Failed to send welcome email", result.error);
        }
      } else {
        posthogServer?.capture({
          distinctId: session.user.id,
          event: "login_completed",
        });
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
