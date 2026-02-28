"use client";

import type { ReactElement } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TextMorph } from "torph/react";
import { authClient, useSession } from "@/lib/auth-client";
import {
  PRICING_FREE_TAGS_ICON,
  PRICING_FREE_EXPORT_ICON,
  PRICING_FREE_SEARCH_ICON,
  PRICING_FREE_SHARE_ICON,
  PRICING_PRO_EVERYTHING_ICON,
  PRICING_PRO_UNLIMITED_BOOKMARKS_ICON,
  PRICING_PRO_UNLIMITED_COLLECTIONS_ICON,
  PRICING_PRO_IMPORT_ICON,
  PRICING_PRO_API_ICON,
  PRICING_PRO_FILTER_ICON,
  PRICING_PRO_SUPPORT_ICON,
} from "@/components/landing-icons";

type BillingCycle = "monthly" | "yearly";

const CHECKOUT_SLUGS: Record<BillingCycle, string> = {
  monthly: "pro-monthly",
  yearly: "pro-yearly",
};

const FREE_PLAN_FEATURES = [
  { icon: PRICING_PRO_UNLIMITED_BOOKMARKS_ICON, label: "Unlimited bookmarks" },
  {
    icon: PRICING_PRO_UNLIMITED_COLLECTIONS_ICON,
    label: "Unlimited collections",
  },
  { icon: PRICING_FREE_EXPORT_ICON, label: "Export your data anytime" },
  { icon: PRICING_FREE_SEARCH_ICON, label: "Search & keyboard shortcuts" },
  {
    icon: PRICING_FREE_SHARE_ICON,
    label: "Public profile",
  },
  {
    icon: PRICING_PRO_UNLIMITED_COLLECTIONS_ICON,
    label: "Shared collections",
  },
];

const PRO_PLAN_FEATURES: {
  icon: ReactElement;
  label: string;
  soon?: boolean;
}[] = [
  { icon: PRICING_PRO_EVERYTHING_ICON, label: "Everything in Free" },
  {
    icon: PRICING_FREE_TAGS_ICON,
    label: "Tags, colors, and notes",
    soon: true,
  },
  { icon: PRICING_PRO_IMPORT_ICON, label: "Import from browser" },
  { icon: PRICING_PRO_API_ICON, label: "API access with rate limits", soon: true },
  { icon: PRICING_PRO_FILTER_ICON, label: "Advanced search and filtering", soon: true },
  { icon: PRICING_PRO_SUPPORT_ICON, label: "Priority support" },
];

const PRO_PLAN_PRICING: Record<BillingCycle, { priceLabel: string }> = {
  monthly: { priceLabel: "$5/month" },
  yearly: { priceLabel: "$50/year" },
};

function PricingFeature({
  feature,
}: {
  feature: { icon: ReactElement; label: string; soon?: boolean };
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="mt-0.5">{feature.icon}</div>
      <span>{feature.label}</span>
      {feature.soon && (
        <span className="ml-auto shrink-0 rounded-full border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
          Soon
        </span>
      )}
    </div>
  );
}

function BillingToggle({
  value,
  onChange,
}: {
  value: BillingCycle;
  onChange: (next: BillingCycle) => void;
}) {
  const isYearly = value === "yearly";

  return (
    <div className="mt-6 flex justify-center">
      <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1">
        <button
          type="button"
          aria-pressed={!isYearly}
          onClick={() => onChange("monthly")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
            isYearly
              ? "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          aria-pressed={isYearly}
          onClick={() => onChange("yearly")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
            isYearly
              ? "bg-zinc-900 text-white hover:bg-zinc-800"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
          }`}
        >
          Yearly
        </button>
      </div>
    </div>
  );
}

export function LandingPricing() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [isCheckoutPending, startCheckoutTransition] = useTransition();
  const { data: session } = useSession();
  const selectedPricing = PRO_PLAN_PRICING[billingCycle];
  const isSignedIn = Boolean(session?.user);
  let proActionLabel = "Sign up";
  if (isCheckoutPending) {
    proActionLabel = "Starting checkout...";
  } else if (isSignedIn) {
    proActionLabel = "Upgrade";
  }

  const signupHref = `/signup?plan=pro&billingCycle=${billingCycle}`;

  const handleFreeAction = () => {
    if (isSignedIn) {
      router.push("/dashboard");
      return;
    }

    router.push(`/signup?plan=free&billingCycle=${billingCycle}`);
  };

  const handleProAction = () => {
    if (!isSignedIn) {
      router.push(signupHref);
      return;
    }

    const currentUser = session?.user;
    if (!currentUser) {
      router.push(signupHref);
      return;
    }

    const discountId = process.env.NEXT_PUBLIC_POLAR_DISCOUNT_ID?.trim();
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim() || window.location.origin;
    startCheckoutTransition(async () => {
      const { error } = await authClient.checkout({
        slug: CHECKOUT_SLUGS[billingCycle],
        allowDiscountCodes: true,
        ...(discountId ? { discountId } : {}),
        successUrl: `${appOrigin}/dashboard?checkout=success&checkout_id={CHECKOUT_ID}`,
        returnUrl: `${appOrigin}/dashboard?checkout=failed`,
        metadata: {
          source: "landing_pricing",
          billingCycle,
          userId: currentUser.id,
        },
        customFieldData: {
          billingCycle,
        },
        referenceId: currentUser.id,
        redirect: true,
      });

      if (error) {
        toast.error(error.message || "Unable to start checkout right now");
      }
    });
  };

  return (
    <div id="pricing" className="mx-auto max-w-[600px] scroll-mt-16">
      <div className="relative mx-auto mb-2 flex max-w-[450px] items-center justify-center">
        <h2 className="z-10 bg-white px-5 text-lg font-medium text-zinc-900">
          Pricing
        </h2>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-200"></div>
      </div>
      <BillingToggle value={billingCycle} onChange={setBillingCycle} />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-5">
          <button
            type="button"
            onClick={handleFreeAction}
            className="absolute right-4 top-4 cursor-pointer rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            {isSignedIn ? "Go to dashboard" : "Sign up"}
          </button>
          <h3 className="mb-1 text-xl font-semibold">Free</h3>
          <p className="text-lg">$0</p>
          <div className="mt-4 flex flex-col gap-1.5">
            {FREE_PLAN_FEATURES.map((feature) => (
              <PricingFeature key={feature.label} feature={feature} />
            ))}
          </div>
        </div>

        <div className="relative flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-5">
          <button
            type="button"
            onClick={handleProAction}
            disabled={isCheckoutPending}
            className="absolute right-4 top-4 cursor-pointer rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {proActionLabel}
          </button>
          <h3 className="mb-1 text-xl font-semibold">Pro</h3>
          <TextMorph
            as="p"
            duration={450}
            className="text-lg font-medium text-zinc-900"
          >
            {selectedPricing.priceLabel}
          </TextMorph>
          <div className="mt-4 flex flex-col gap-1.5">
            {PRO_PLAN_FEATURES.map((feature) => (
              <PricingFeature key={feature.label} feature={feature} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
