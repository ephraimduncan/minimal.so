"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OAuthButton } from "@/components/oauth-button";
import { useAutofill } from "@/hooks/use-autofill";
import posthog from "posthog-js";
import { signUp } from "@/lib/auth-client";
import { signupSchema } from "@/lib/schema";
import { type BillingCycle, startCheckout } from "@/lib/checkout";

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
  const checkoutCallbackURL = isProSignup
    ? `/signup/complete?plan=pro&billingCycle=${billingCycle}`
    : "/dashboard";

  type AuthData = Awaited<ReturnType<typeof signUp.email>>["data"];
  const authRef = useRef<AuthData>(null);

  useEffect(() => {
    posthog.capture("signup_started");
  }, []);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    validators: {
      onSubmit: signupSchema,
      onSubmitAsync: async ({ value }) => {
        const { data, error } = await signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        });
        if (error) {
          return { form: error.message ?? "An error occurred", fields: {} };
        }
        authRef.current = data;
        return null;
      },
    },
    onSubmit: async () => {
      if (authRef.current?.user) {
        posthog.identify(authRef.current.user.id, {
          email: authRef.current.user.email,
          name: authRef.current.user.name,
          created_at: authRef.current.user.createdAt,
        });
        posthog.capture("signup_completed");
      }

      if (isProSignup) {
        await startCheckout({
          billingCycle,
          source: "signup_form",
          userId: authRef.current?.user?.id,
        });
        return;
      }

      router.push("/dashboard");
    },
  });

  const formRef = useAutofill(
    (name, value) => form.setFieldValue(name, value),
    SIGNUP_FIELDS,
  );

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

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="gap-4">
          <form.Field
            name="name"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ephraim Duncan"
                  autoComplete="name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          />
          <form.Field
            name="email"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="hello@ephraimduncan.com"
                  autoComplete="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          />
          <form.Field
            name="password"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  autoComplete="new-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          />
          <form.Field
            name="confirmPassword"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="********"
                  autoComplete="new-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          />
          <form.Subscribe
            selector={(state) => {
              const e = state.errorMap.onSubmit;
              return typeof e === "string" ? e : null;
            }}
            children={(error) =>
              error ? <FieldError errors={[{ message: error }]} /> : null
            }
          />
          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Loading..." : "Sign up"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Login
                  </Link>
                </FieldDescription>
              </Field>
            )}
          />
        </FieldGroup>
      </form>
    </div>
  );
}
