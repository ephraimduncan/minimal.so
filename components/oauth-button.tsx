"use client";

import { useTransition } from "react";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

type Provider = "google";

interface OAuthButtonProps {
  provider: Provider;
  mode: "signin" | "signup";
}

const providerConfig = {
  google: {
    icon: IconBrandGoogleFilled,
    label: "Google",
  },
};

export function OAuthButton({ provider, mode }: OAuthButtonProps) {
  const [isPending, startTransition] = useTransition();
  const config = providerConfig[provider];
  const Icon = config.icon;

  function handleClick() {
    startTransition(async () => {
      const { error } = await signIn.social({
        provider,
        callbackURL: "/",
      });

      if (error) {
        toast.error(error.message ?? "Something went wrong. Please try again.");
      }
    });
  }

  const label =
    mode === "signin"
      ? `Sign in with ${config.label}`
      : `Sign up with ${config.label}`;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-0"
      onClick={handleClick}
      disabled={isPending}
    >
      <Icon className="mr-2 h-4 w-4" />
      {isPending ? "Redirecting..." : label}
    </Button>
  );
}
