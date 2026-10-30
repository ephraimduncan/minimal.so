import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import type { DB } from "./db";
import { APP_URL } from "./config";
import { account, group, session, user, verification } from "./db/schema";
import { sendEmail } from "./email";
import { welcomeEmail } from "./emails/welcome";
import { verificationEmail } from "./emails/verify-email";
import { resetPasswordEmail } from "./emails/reset-password";
import { hasActiveProAccess, type PlanValue } from "./plan-limits";

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

function resolvePlan(
  proProductIds: Set<string>,
  status: string,
  productId: string,
  currentPeriodEnd?: Date | null,
): PlanValue {
  if (!proProductIds.has(productId)) return "free";
  return hasActiveProAccess("pro", status, currentPeriodEnd) ? "pro" : "free";
}

async function syncCustomerData(
  db: DB,
  input: { customerId: string; externalId: string | null; email: string },
): Promise<void> {
  if (input.externalId) {
    await db
      .update(user)
      .set({
        polarCustomerId: input.customerId,
        polarCustomerExternalId: input.externalId,
      })
      .where(eq(user.id, input.externalId));
    return;
  }

  await db
    .update(user)
    .set({ polarCustomerId: input.customerId })
    .where(eq(user.email, input.email));
}

async function syncSubscriptionData(
  db: DB,
  proProductIds: Set<string>,
  input: SubscriptionSyncInput,
  eventTimestamp?: Date,
): Promise<void> {
  const eventTime = eventTimestamp ?? new Date();

  await db
    .update(user)
    .set({
      plan: resolvePlan(
        proProductIds,
        input.status,
        input.productId,
        input.currentPeriodEnd,
      ),
      subscriptionStatus: input.status,
      polarSubscriptionId: input.id,
      polarProductId: input.productId,
      polarCheckoutId: input.checkoutId,
      subscriptionCurrentPeriodEnd: input.currentPeriodEnd,
      subscriptionCancelAtPeriodEnd: input.cancelAtPeriodEnd,
      subscriptionCanceledAt: input.canceledAt,
      planUpdatedAt: eventTime,
    })
    .where(
      and(
        eq(user.polarCustomerId, input.customerId),
        or(isNull(user.planUpdatedAt), lt(user.planUpdatedAt, eventTime)),
      ),
    );
}

async function ensureDefaultGroup(db: DB, userId: string): Promise<void> {
  const existing = await db.$count(group, eq(group.userId, userId));
  if (existing > 0) return;

  await db.insert(group).values({ name: "Bookmarks", color: "#74B06F", userId });
}

export function createAuth(db: DB) {
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
  } = process.env;

  const appUrl = APP_URL;

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
  ].filter(
    (mapping): mapping is { productId: string; slug: string } =>
      Boolean(mapping),
  );

  const proProductIds = new Set(polarProductMappings.map((m) => m.productId));

  return betterAuth({
    baseURL: appUrl,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: { user, session, account, verification },
    }),
    trustedOrigins: CHROME_EXTENSION_ID
      ? [`chrome-extension://${CHROME_EXTENSION_ID}`]
      : [],
    rateLimit: {
      enabled: true,
      window: 60,
      max: 10,
    },
    // A Worker gets the client IP in CF-Connecting-IP, not X-Forwarded-For.
    // Without this header, better-auth skips rate limits.
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    plugins: [
      ...(polarEnabled
        ? [
            polar({
              client: new Polar({
                accessToken: POLAR_ACCESS_TOKEN,
                server: polarServer,
              }),
              createCustomerOnSignUp: polarCreateCustomerOnSignUp,
              getCustomerCreateParams: async ({ user: polarUser }) => ({
                metadata: polarUser.id
                  ? {
                      appUserId: polarUser.id,
                    }
                  : undefined,
              }),
              use: [
                checkout({
                  products: polarProductMappings,
                  successUrl:
                    "/dashboard?checkout=success&checkout_id={CHECKOUT_ID}",
                  authenticatedUsersOnly: true,
                  returnUrl: appUrl,
                }),
                portal({
                  returnUrl: `${appUrl}/dashboard`,
                }),
                webhooks({
                  secret: POLAR_WEBHOOK_SECRET!,
                  onCustomerCreated: (payload: { data: CustomerSyncInput }) =>
                    syncCustomerData(db, {
                      customerId: payload.data.id,
                      externalId: payload.data.externalId,
                      email: payload.data.email,
                    }),
                  onCustomerUpdated: (payload: { data: CustomerSyncInput }) =>
                    syncCustomerData(db, {
                      customerId: payload.data.id,
                      externalId: payload.data.externalId,
                      email: payload.data.email,
                    }),
                  onSubscriptionCreated: (payload: {
                    data: SubscriptionSyncInput;
                    timestamp?: Date;
                  }) =>
                    syncSubscriptionData(
                      db,
                      proProductIds,
                      payload.data,
                      payload.timestamp,
                    ),
                  onSubscriptionUpdated: (payload: {
                    data: SubscriptionSyncInput;
                    timestamp?: Date;
                  }) =>
                    syncSubscriptionData(
                      db,
                      proProductIds,
                      payload.data,
                      payload.timestamp,
                    ),
                  onSubscriptionActive: (payload: {
                    data: SubscriptionSyncInput;
                    timestamp?: Date;
                  }) =>
                    syncSubscriptionData(
                      db,
                      proProductIds,
                      payload.data,
                      payload.timestamp,
                    ),
                  onSubscriptionCanceled: (payload: {
                    data: SubscriptionSyncInput;
                    timestamp?: Date;
                  }) =>
                    syncSubscriptionData(
                      db,
                      proProductIds,
                      payload.data,
                      payload.timestamp,
                    ),
                  onSubscriptionRevoked: (payload: {
                    data: SubscriptionSyncInput;
                    timestamp?: Date;
                  }) =>
                    syncSubscriptionData(
                      db,
                      proProductIds,
                      payload.data,
                      payload.timestamp,
                    ),
                  onSubscriptionUncanceled: (payload: {
                    data: SubscriptionSyncInput;
                    timestamp?: Date;
                  }) =>
                    syncSubscriptionData(
                      db,
                      proProductIds,
                      payload.data,
                      payload.timestamp,
                    ),
                }),
              ],
            }),
          ]
        : []),
      tanstackStartCookies(),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: !import.meta.env.DEV,
      sendResetPassword: async ({ user: resetUser, url }) => {
        const result = await sendEmail({
          to: resetUser.email,
          ...resetPasswordEmail(resetUser.name, url),
        });

        if (!result.ok) {
          throw new Error("Failed to send password reset email");
        }
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user: verifyUser, url }) => {
        const result = await sendEmail({
          to: verifyUser.email,
          ...verificationEmail(verifyUser.name, url),
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
        const newSession = ctx.context.newSession;
        if (!newSession) return;

        await ensureDefaultGroup(db, newSession.user.id);

        const isNewUser =
          Date.now() - new Date(newSession.user.createdAt).getTime() < 60_000;
        if (isNewUser) {
          const result = await sendEmail({
            to: newSession.user.email,
            ...welcomeEmail(newSession.user.name),
          });

          if (!result.ok) {
            console.error("[auth] Failed to send welcome email", result.error);
          }
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
export type User = Session["user"];
