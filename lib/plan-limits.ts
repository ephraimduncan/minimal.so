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
