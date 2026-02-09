"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { signIn } from "@/lib/auth-client";
import { loginSchema, type LoginFormData } from "@/lib/schema";

const LOGIN_FIELDS = [
  { name: "email", id: "email" },
  { name: "password", id: "password" },
] as const;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Detect password manager autofill via CSS animation
  const formRef = useAutofill(setValue, LOGIN_FIELDS);

  const onSubmit = async (data: LoginFormData) => {
    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("root", { message: error.message ?? "An error occurred" });
      return;
    }

    router.push("/dashboard");
  };

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

      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-4">
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
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <a
                href="#"
                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="********"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </Field>
          {errors.root && (
            <p className="text-sm text-red-500">{errors.root.message}</p>
          )}
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
        </FieldGroup>
      </form>
    </div>
  );
}
