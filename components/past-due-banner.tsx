"use client";

import { useState, useTransition } from "react";
import { IconAlertTriangle, IconLoader2, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function PastDueBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (dismissed) return null;

  const handleUpdatePayment = () => {
    startTransition(async () => {
      const { error } = await authClient.customer.portal({ redirect: true });
      if (error) {
        toast.error(error.message || "Unable to open billing portal");
      }
    });
  };

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2">
      <IconAlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground" />
      <p className="flex-1 text-sm text-warning-foreground">
        Your last payment failed. Please update your payment method to keep your
        Pro subscription.
      </p>
      <Button
        variant="outline"
        className="h-7 shrink-0 gap-1.5 rounded-md border-warning/40 px-2.5 text-xs text-warning-foreground hover:bg-warning/20"
        onClick={handleUpdatePayment}
        disabled={isPending}
      >
        {isPending ? (
          <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
        ) : null}
        Update Payment
      </Button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-md p-0.5 text-warning-foreground/60 transition-colors hover:text-warning-foreground"
      >
        <IconX className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
