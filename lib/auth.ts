import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { sendEmail } from "./email";
import { welcomeEmail } from "./emails/welcome";
import { verifyEmailEmail } from "./emails/verify-email";
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
      const { subject, html } = resetPasswordEmail(user.name, url);
      void sendEmail({ to: user.email, subject, html });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { subject, html } = verifyEmailEmail(user.name, url);
      void sendEmail({ to: user.email, subject, html });
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
        const { subject, html } = welcomeEmail(session.user.name);
        void sendEmail({ to: session.user.email, subject, html });
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
