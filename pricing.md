# Pricing Setup and Local Testing

This guide documents how pricing is wired in this repo, which env keys are
required, what `POLAR_ACCESS_TOKEN` scopes to use, and how to validate all
pricing outcomes locally before production.

## Current Pricing Model

- Free or paid only.
- No trial flow in checkout.
- Billing provider: Polar via `@polar-sh/better-auth`.

## Access Token Scopes (POLAR_ACCESS_TOKEN)

For this codebase, create an Organization Access Token with at least:

- `checkouts:write` (required for checkout session creation)
- `customers:write` (required for customer creation/sync)
- `customer_sessions:write` (required for customer portal sessions)

If you manage webhook endpoints via Polar API instead of dashboard UI:

- `webhooks:write` (required)
- `webhooks:read` (optional, for listing endpoints)

Notes:

- Keep token server-side only. Never expose it in client code.
- Use separate tokens for sandbox and production.

## Environment Variables

Copy `.env.example` to `.env` and set:

Required:

- `BETTER_AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_SERVER` (`sandbox` for local testing, `production` for live)
- `POLAR_CREATE_CUSTOMER_ON_SIGN_UP` (`false` recommended for resilient signup)
- `POLAR_PRO_MONTHLY_PRODUCT_ID`
- `POLAR_PRO_YEARLY_PRODUCT_ID`

Optional pricing controls:

- `NEXT_PUBLIC_DEFAULT_BILLING_CYCLE` (`monthly` or `yearly`)
- `NEXT_PUBLIC_POLAR_DISCOUNT_ID` (preset discount in checkout)

Not supported by this app:

- Trial env vars (`NEXT_PUBLIC_POLAR_TRIAL_INTERVAL*`) are intentionally not
  used.

Recommended:

- Keep `POLAR_CREATE_CUSTOMER_ON_SIGN_UP=false` so user signup is not blocked if
  Polar credentials are temporarily invalid. Customer records can still be
  created/synced through checkout and webhook flows.

## Polar Dashboard Setup

1. Create monthly and yearly products in Polar (sandbox first).
2. Copy both product IDs into `.env`.
3. Create a webhook endpoint in Polar targeting:
   - `https://<your-domain>/api/auth/polar/webhooks`
4. Copy webhook secret into `POLAR_WEBHOOK_SECRET`.

### Webhook Events to Enable

This app currently handles these Better Auth webhook callbacks in
`lib/auth.ts`:

- `onCustomerCreated`
- `onCustomerUpdated`
- `onSubscriptionCreated`
- `onSubscriptionUpdated`
- `onSubscriptionActive`
- `onSubscriptionCanceled`
- `onSubscriptionRevoked`
- `onSubscriptionUncanceled`

Enable the matching Polar event types on your webhook endpoint:

- `customer.created`
- `customer.updated`
- `subscription.created`
- `subscription.updated`
- `subscription.active`
- `subscription.canceled`
- `subscription.revoked`
- `subscription.uncanceled`

Why include both `subscription.updated` and specific subscription events:

- `subscription.updated` acts as a catch-all for status transitions and period
  changes.
- specific events (`active`, `canceled`, `revoked`, `uncanceled`) provide
  explicit lifecycle transitions and are already wired in the app.

For local development, use a tunnel URL (ngrok/cloudflared) in step 3.

## Local End-to-End Test Setup

1. Set `.env` with `POLAR_SERVER=sandbox`.
2. Start app:

```bash
bun run dev
```

3. Start a public tunnel to local app (example with ngrok):

```bash
ngrok http 3000
```

4. In Polar sandbox webhook settings, set endpoint to:
   - `https://<ngrok-id>.ngrok-free.app/api/auth/polar/webhooks`
5. Confirm webhook secret in Polar matches `POLAR_WEBHOOK_SECRET`.
6. Open Prisma Studio for DB verification:

```bash
bun run db:studio
```

## Local Pricing Test Matrix

Use a fresh sandbox user.

### A) Landing Page and Routing

1. Open `/` and switch Monthly/Yearly.
   - Expected: Pro price label updates.
2. Signed out: click Pro CTA.
   - Expected: redirect to `/signup?plan=pro&billingCycle=<cycle>`.
3. Signed out: click Free CTA.
   - Expected: redirect to `/signup?plan=free&billingCycle=<cycle>`.

### B) Checkout Start

4. Sign in and click Upgrade on landing (monthly).
   - Expected: redirected to Polar checkout with monthly product.
5. Repeat for yearly.
   - Expected: redirected to Polar checkout with yearly product.

### C) Successful Payment Path

6. Complete payment in Polar sandbox checkout.
   - Expected redirect: `/dashboard?checkout=success&checkout_id=...`.
7. Verify user fields in DB (`user` table):
   - `plan = "pro"`
   - `subscriptionStatus` is active-like (`active` in typical case)
   - `polarCustomerId` populated
   - `polarSubscriptionId` populated
   - `polarProductId` populated
   - `planUpdatedAt` updated

### D) Canceled Checkout Path

8. Start checkout and cancel/close before payment.
   - Expected: user remains free, no pro access enabled.

### E) Billing Portal Path

9. In dashboard menu, click Billing Portal.
   - Expected: redirects to Polar customer portal without error.

### F) Subscription State Changes

10. Cancel subscription in Polar sandbox.
    - Expected after webhook: `subscriptionStatus` updates to canceled/revoked,
      `plan` becomes `free`.
11. If uncancel is available in sandbox, uncancel/reactivate.
    - Expected: active-like status and `plan = "pro"`.

### G) Discount Behavior (Optional)

12. Set `NEXT_PUBLIC_POLAR_DISCOUNT_ID` and restart app.
    - Expected: checkout opens with discount pre-applied.

## Pre-Production Checklist

1. Switch to production credentials:
   - `POLAR_SERVER=production`
   - production `POLAR_ACCESS_TOKEN`
   - production product IDs
   - production webhook endpoint + secret
2. Confirm `NEXT_PUBLIC_APP_URL` is production URL.
3. Validate one full paid purchase in production with a low-risk internal test.
4. Confirm webhook events update user plan/status in production DB.
5. Confirm Billing Portal works from production dashboard.

## Troubleshooting

- Checkout fails to start:
  - Verify `POLAR_ACCESS_TOKEN`, product IDs, and server mode match
    (sandbox vs production).
- User paid but plan not updated:
  - Check webhook endpoint URL, secret, and delivery logs in Polar.
- Portal fails to open:
  - Ensure token has `customer_sessions:write`.
- Redirect issues:
  - Verify `NEXT_PUBLIC_APP_URL` and success/return URLs.
