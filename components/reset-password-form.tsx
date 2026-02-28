"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
import { resetPassword } from "@/lib/auth-client";
import { resetPasswordSchema } from "@/lib/schema";
import { toast } from "sonner";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: {
      onSubmit: resetPasswordSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await resetPassword({
          newPassword: value.password,
          token: token!,
        });
        if (error) {
          return { form: error.message ?? "Something went wrong", fields: {} };
        }
        return null;
      },
    },
    onSubmit: () => {
      toast.success("Password reset successfully");
      router.push("/login");
    },
  });

  if (urlError === "INVALID_TOKEN" || !token) {
    return (
      <div className={cn("flex flex-col gap-2", className)} {...props}>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Invalid reset link</h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired
          </p>
        </div>
        <FieldDescription className="text-center">
          <Link
            href="/forgot-password"
            className="underline underline-offset-4"
          >
            Request a new reset link
          </Link>
        </FieldDescription>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Set new password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
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
            name="password"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor="password">New password</FieldLabel>
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
                  Confirm password
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
                  {isSubmitting ? "Loading..." : "Reset password"}
                </Button>
                <FieldDescription className="text-center">
                  <Link
                    href="/login"
                    className="underline underline-offset-4"
                  >
                    Back to login
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
