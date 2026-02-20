"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OAuthButton } from "@/components/oauth-button";
import { useAutofill } from "@/hooks/use-autofill";
import posthog from "posthog-js";
import { toast } from "sonner";
import { authClient, signUp } from "@/lib/auth-client";
import { signupSchema, type SignupFormData } from "@/lib/schema";

type BillingCycle = "monthly" | "yearly";

const CHECKOUT_SLUGS: Record<BillingCycle, string> = {
  monthly: "pro-monthly",
  yearly: "pro-yearly",
};

const SIGNUP_FIELDS = [
  { name: "name", id: "name" },
  { name: "email", id: "email" },
  { name: "password", id: "password" },
  { name: "confirmPassword", id: "confirm-password" },
] as const;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan");
  const billingCycleParam = searchParams.get("billingCycle");
  const billingCycle: BillingCycle =
    billingCycleParam === "monthly" ? "monthly" : "yearly";
  const isProSignup = selectedPlan === "pro";
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim() || window.location.origin;
  const checkoutCallbackURL = isProSignup
    ? `/signup/complete?plan=pro&billingCycle=${billingCycle}`
    : "/dashboard";

  useEffect(() => {
    posthog.capture("signup_started");
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Detect password manager autofill via CSS animation
  const formRef = useAutofill(setValue, SIGNUP_FIELDS);

  const onSubmit = async (data: SignupFormData) => {
    const { data: authData, error } = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("root", { message: error.message ?? "An error occurred" });
      return;
    }

    if (authData?.user) {
      posthog.identify(authData.user.id, {
        email: authData.user.email,
        name: authData.user.name,
        created_at: authData.user.createdAt,
      });
      posthog.capture("signup_completed");
    }

    if (isProSignup) {
      const { error: checkoutError } = await authClient.checkout({
        slug: CHECKOUT_SLUGS[billingCycle],
        allowDiscountCodes: true,
        successUrl: `${appOrigin}/dashboard?checkout=success&checkout_id={CHECKOUT_ID}`,
        returnUrl: `${appOrigin}/dashboard?checkout=failed`,
        metadata: {
          source: "signup_form",
          billingCycle,
          userId: authData?.user?.id,
        },
        customFieldData: {
          billingCycle,
        },
        referenceId: authData?.user?.id,
        redirect: true,
      });

      if (checkoutError) {
        toast.error(checkoutError.message || "Unable to start checkout right now");
        return;
      }

      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Sign up</h1>
        <p className="text-sm text-muted-foreground">
          Create an account to get started
        </p>
      </div>

      <OAuthButton
        provider="google"
        mode="signup"
        callbackURL={checkoutCallbackURL}
      />

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or continue with email
          </span>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="Ephraim Duncan"
              autoComplete="name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="hello@ephraimduncan.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </Field>
          {errors.root && (
            <p className="text-sm text-red-500">{errors.root.message}</p>
          )}
          <Field>
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting ? "Loading..." : "Sign up"}
            </Button>

            <FieldDescription className="text-center">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Login
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
