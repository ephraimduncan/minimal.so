"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth-client";

type BillingCycle = "monthly" | "yearly";

const CHECKOUT_SLUGS: Record<BillingCycle, string> = {
  monthly: "pro-monthly",
  yearly: "pro-yearly",
};

export function SignupCompleteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const startedCheckoutRef = useRef(false);

  useEffect(() => {
    if (startedCheckoutRef.current) {
      return;
    }

    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.replace("/signup");
      return;
    }

    const plan = searchParams.get("plan");
    const billingCycleParam = searchParams.get("billingCycle");
    const billingCycle: BillingCycle =
      billingCycleParam === "monthly" ? "monthly" : "yearly";

    if (plan !== "pro") {
      router.replace("/dashboard");
      return;
    }

    startedCheckoutRef.current = true;
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim() || window.location.origin;

    void (async () => {
      const { error } = await authClient.checkout({
        slug: CHECKOUT_SLUGS[billingCycle],
        allowDiscountCodes: true,
        successUrl: `${appOrigin}/dashboard?checkout=success&checkout_id={CHECKOUT_ID}`,
        returnUrl: `${appOrigin}/dashboard?checkout=failed`,
        metadata: {
          source: "signup_oauth",
          billingCycle,
          userId: session.user.id,
        },
        customFieldData: {
          billingCycle,
        },
        referenceId: session.user.id,
        redirect: true,
      });

      if (error) {
        toast.error(error.message || "Unable to start checkout right now");
        router.replace("/dashboard");
      }
    })();
  }, [isPending, router, searchParams, session?.user, session?.user?.id]);

  return (
    <div className="w-full max-w-xs text-center text-sm text-muted-foreground">
      Preparing your checkout...
    </div>
  );
}
