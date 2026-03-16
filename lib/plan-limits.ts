export const VALID_PLANS = ["free", "pro"] as const;
export type PlanValue = (typeof VALID_PLANS)[number];

type SubscriptionStatus = string | null | undefined;

export function hasActiveProAccess(
  plan: string | null | undefined,
  subscriptionStatus: SubscriptionStatus,
  subscriptionCurrentPeriodEnd?: Date | string | null,
): boolean {
  if (plan !== "pro") return false;

  if (
    subscriptionStatus === "active" ||
    subscriptionStatus === "trialing" ||
    subscriptionStatus === "past_due"
  ) {
    return true;
  }

  if (subscriptionStatus === "canceled") {
    if (!subscriptionCurrentPeriodEnd) return false;
    const periodEnd =
      typeof subscriptionCurrentPeriodEnd === "string"
        ? new Date(subscriptionCurrentPeriodEnd)
        : subscriptionCurrentPeriodEnd;
    return periodEnd.getTime() > Date.now();
  }

  return false;
}

export function isValidPlan(value: string): value is PlanValue {
  return (VALID_PLANS as readonly string[]).includes(value);
}
