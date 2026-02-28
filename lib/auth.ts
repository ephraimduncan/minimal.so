import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db } from "./db";
import { APP_URL } from "./config";
import { posthogServer } from "./posthog-server";
import { sendEmail } from "./email";
import { welcomeEmail } from "./emails/welcome";
import { verificationEmail } from "./emails/verify-email";
import { resetPasswordEmail } from "./emails/reset-password";
import { hasActiveProAccess, type PlanValue } from "./plan-limits";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  CHROME_EXTENSION_ID,
  POLAR_ACCESS_TOKEN,
  POLAR_WEBHOOK_SECRET,
  POLAR_SERVER,
  POLAR_CREATE_CUSTOMER_ON_SIGN_UP,
  POLAR_PRO_MONTHLY_PRODUCT_ID,
  POLAR_PRO_YEARLY_PRODUCT_ID,
  NEXT_PUBLIC_APP_URL,
} = process.env;
const googleOAuthEnabled = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
const polarServer = POLAR_SERVER === "sandbox" ? "sandbox" : "production";
const polarEnabled = Boolean(POLAR_ACCESS_TOKEN && POLAR_WEBHOOK_SECRET);
const polarCreateCustomerOnSignUp =
  POLAR_CREATE_CUSTOMER_ON_SIGN_UP === "true";

const polarProductMappings = [
  POLAR_PRO_MONTHLY_PRODUCT_ID
    ? { productId: POLAR_PRO_MONTHLY_PRODUCT_ID, slug: "pro-monthly" }
    : null,
  POLAR_PRO_YEARLY_PRODUCT_ID
    ? { productId: POLAR_PRO_YEARLY_PRODUCT_ID, slug: "pro-yearly" }
    : null,
].filter((mapping): mapping is { productId: string; slug: string } => Boolean(mapping));

function resolvePlan(status: string): PlanValue {
  return hasActiveProAccess("pro", status) ? "pro" : "free";
}

type CustomerSyncInput = {
  id: string;
  externalId: string | null;
  email: string;
};

type SubscriptionSyncInput = {
  id: string;
  status: string;
  customerId: string;
  productId: string;
  checkoutId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
};

async function syncCustomerData(input: {
  customerId: string;
  externalId: string | null;
  email: string;
}): Promise<void> {
  if (input.externalId) {
    await db.user.updateMany({
      where: { id: input.externalId },
      data: {
        polarCustomerId: input.customerId,
        polarCustomerExternalId: input.externalId,
        planUpdatedAt: new Date(),
      },
    });
    return;
  }

  await db.user.updateMany({
    where: { email: input.email },
    data: {
      polarCustomerId: input.customerId,
      planUpdatedAt: new Date(),
    },
  });
}

async function syncSubscriptionData(input: SubscriptionSyncInput): Promise<void> {
  await db.user.updateMany({
    where: { polarCustomerId: input.customerId },
    data: {
      plan: resolvePlan(input.status),
      subscriptionStatus: input.status,
      polarSubscriptionId: input.id,
      polarProductId: input.productId,
      polarCheckoutId: input.checkoutId,
      subscriptionCurrentPeriodEnd: input.currentPeriodEnd,
      subscriptionCancelAtPeriodEnd: input.cancelAtPeriodEnd,
      subscriptionCanceledAt: input.canceledAt,
      planUpdatedAt: new Date(),
    },
  });
}

async function handleCustomerPayload(payload: {
  data: CustomerSyncInput;
}): Promise<void> {
  await syncCustomerData({
    customerId: payload.data.id,
    externalId: payload.data.externalId,
    email: payload.data.email,
  });
}

async function handleSubscriptionPayload(payload: {
  data: SubscriptionSyncInput;
}): Promise<void> {
  await syncSubscriptionData(payload.data);
}

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
  plugins: [
    nextCookies(),
    ...(polarEnabled
      ? [
          polar({
            client: new Polar({
              accessToken: POLAR_ACCESS_TOKEN,
              server: polarServer,
            }),
            createCustomerOnSignUp: polarCreateCustomerOnSignUp,
            getCustomerCreateParams: async ({ user }) => ({
              metadata: user.id
                ? {
                    appUserId: user.id,
                  }
                : undefined,
            }),
            use: [
              checkout({
                products: polarProductMappings,
                successUrl: "/dashboard?checkout=success&checkout_id={CHECKOUT_ID}",
                authenticatedUsersOnly: true,
                returnUrl: NEXT_PUBLIC_APP_URL ?? undefined,
              }),
              portal({
                returnUrl: NEXT_PUBLIC_APP_URL
                  ? `${NEXT_PUBLIC_APP_URL}/dashboard`
                  : undefined,
              }),
              webhooks({
                secret: POLAR_WEBHOOK_SECRET!,
                onCustomerCreated: handleCustomerPayload,
                onCustomerUpdated: handleCustomerPayload,
                onSubscriptionCreated: handleSubscriptionPayload,
                onSubscriptionUpdated: handleSubscriptionPayload,
                onSubscriptionActive: handleSubscriptionPayload,
                onSubscriptionCanceled: handleSubscriptionPayload,
                onSubscriptionRevoked: handleSubscriptionPayload,
                onSubscriptionUncanceled: handleSubscriptionPayload,
              }),
            ],
          }),
        ]
      : []),
  ],
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
          ...welcomeEmail(session.user.name),
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
