"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { signIn } from "@/lib/auth-client";
import { loginSchema } from "@/lib/schema";

const LOGIN_FIELDS = [
  { name: "email", id: "email" },
  { name: "password", id: "password" },
] as const;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  type AuthData = Awaited<ReturnType<typeof signIn.email>>["data"];
  const authRef = useRef<AuthData>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: {
      onSubmit: loginSchema,
      onSubmitAsync: async ({ value }) => {
        const { data, error } = await signIn.email({
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
    onSubmit: () => {
      if (authRef.current?.user) {
        posthog.identify(authRef.current.user.id, {
          email: authRef.current.user.email,
          name: authRef.current.user.name,
          created_at: authRef.current.user.createdAt,
        });
        posthog.capture("login_completed");
      }
      router.push("/dashboard");
    },
  });

  const formRef = useAutofill(
    (name, value) => form.setFieldValue(name, value),
    LOGIN_FIELDS
  );

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      <OAuthButton provider="google" mode="signin" />

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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  autoComplete="current-password"
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
                  {isSubmitting ? "Loading..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="underline underline-offset-4">
                    Sign up
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
