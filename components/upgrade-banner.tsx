"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { IconRocket } from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";
import { FREE_BOOKMARK_LIMIT } from "@/lib/plan-limits";

interface UpgradeBannerProps {
  totalBookmarks: number;
}

export function UpgradeBanner({ totalBookmarks }: UpgradeBannerProps) {
  const [isPending, startTransition] = useTransition();
  const usage = Math.min(
    Math.round((totalBookmarks / FREE_BOOKMARK_LIMIT) * 100),
    100,
  );

  const handleUpgrade = () => {
    startTransition(async () => {
      const defaultCycle =
        process.env.NEXT_PUBLIC_DEFAULT_BILLING_CYCLE === "monthly"
          ? "monthly"
          : "yearly";
      const appOrigin =
        process.env.NEXT_PUBLIC_APP_URL?.trim() || window.location.origin;

      const { error } = await authClient.checkout({
        slug: defaultCycle === "monthly" ? "pro-monthly" : "pro-yearly",
        allowDiscountCodes: true,
        successUrl: `${appOrigin}/dashboard?checkout=success&checkout_id={CHECKOUT_ID}`,
        returnUrl: `${appOrigin}/dashboard?checkout=failed`,
        metadata: {
          source: "upgrade_banner",
          billingCycle: defaultCycle,
        },
        customFieldData: {
          billingCycle: defaultCycle,
        },
        redirect: true,
      });

      if (error) {
        toast.error(error.message || "Unable to start checkout right now");
      }
    });
  };

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-zinc-600">
        <span>
          {totalBookmarks} / {FREE_BOOKMARK_LIMIT} bookmarks
        </span>
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-zinc-400 transition-all"
            style={{ width: `${usage}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={isPending}
        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <IconRocket className="h-3 w-3" />
        {isPending ? "Loading..." : "Upgrade"}
      </button>
    </div>
  );
}
