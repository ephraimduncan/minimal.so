export const VALID_PLANS = ["free", "pro"] as const;
export type PlanValue = (typeof VALID_PLANS)[number];

export const FREE_BOOKMARK_LIMIT = 500;
export const FREE_GROUP_LIMIT = 50;

type SubscriptionStatus = string | null | undefined;

export function hasActiveProAccess(
  plan: string | null | undefined,
  subscriptionStatus: SubscriptionStatus,
): boolean {
  if (plan !== "pro") return false;
  return (
    subscriptionStatus === "active" ||
    subscriptionStatus === "trialing" ||
    subscriptionStatus === "past_due"
  );
}

export function isValidPlan(value: string): value is PlanValue {
  return (VALID_PLANS as readonly string[]).includes(value);
}
