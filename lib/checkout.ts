"use client";

import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export type BillingCycle = "monthly" | "yearly";

export const CHECKOUT_SLUGS: Record<BillingCycle, string> = {
  monthly: "pro-monthly",
  yearly: "pro-yearly",
};

export function getAppOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || window.location.origin;
}

export async function startCheckout(options: {
  billingCycle: BillingCycle;
  source: string;
  userId?: string;
  discountId?: string;
}): Promise<boolean> {
  const appOrigin = getAppOrigin();
  const { error } = await authClient.checkout({
    slug: CHECKOUT_SLUGS[options.billingCycle],
    allowDiscountCodes: true,
    ...(options.discountId ? { discountId: options.discountId } : {}),
    successUrl: `${appOrigin}/dashboard?checkout=success&checkout_id={CHECKOUT_ID}`,
    returnUrl: `${appOrigin}/dashboard?checkout=failed`,
    metadata: {
      source: options.source,
      billingCycle: options.billingCycle,
      ...(options.userId ? { userId: options.userId } : {}),
    },
    customFieldData: {
      billingCycle: options.billingCycle,
    },
    ...(options.userId ? { referenceId: options.userId } : {}),
    redirect: true,
  });

  if (error) {
    toast.error(error.message || "Unable to start checkout right now");
    return false;
  }
  return true;
}
