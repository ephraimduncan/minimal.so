"use client";

import { useState } from "react";
import Link from "next/link";
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
import { requestPasswordReset } from "@/lib/auth-client";
import { forgotPasswordSchema } from "@/lib/schema";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onSubmit: forgotPasswordSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await requestPasswordReset({
          email: value.email,
          redirectTo: "/reset-password",
        });
        if (error) {
          return { form: error.message ?? "Something went wrong", fields: {} };
        }
        return null;
      },
    },
    onSubmit: () => {
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <div className={cn("flex flex-col gap-2", className)} {...props}>
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-semibold text-balance">Check your email</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            We sent a password reset link to your email
          </p>
        </div>
        <FieldDescription className="text-center">
          <Link href="/login" className="underline underline-offset-4">
            Back to login
          </Link>
        </FieldDescription>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-balance">Reset your password</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="gap-4">
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
                  {isSubmitting ? "Loading..." : "Send reset link"}
                </Button>
                <FieldDescription className="text-center">
                  Remember your password?{" "}
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
