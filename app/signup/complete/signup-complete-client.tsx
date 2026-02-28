"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { type BillingCycle, startCheckout } from "@/lib/checkout";

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

    void startCheckout({
      billingCycle,
      source: "signup_oauth",
      userId: session.user.id,
    }).then((ok) => {
      if (!ok) router.replace("/dashboard");
    });
  }, [isPending, router, searchParams, session?.user, session?.user?.id]);

  return (
    <div className="w-full max-w-xs text-center text-sm text-muted-foreground">
      Preparing your checkout...
    </div>
  );
}
