"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { sendVerificationEmail } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    setError(null);

    const { error: resendError } = await sendVerificationEmail({
      email,
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message ?? "Failed to resend verification email");
      return;
    }

    setResent(true);
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-xs">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-xl font-semibold">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a verification link to{" "}
              {email ? (
                <span className="font-medium text-foreground">{email}</span>
              ) : (
                "your email"
              )}
            </p>
          </div>

          {email && (
            <div className="flex flex-col gap-2 text-center">
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {resent ? (
                <p className="text-sm text-muted-foreground">
                  Verification email resent
                </p>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? "Resending..." : "Resend verification email"}
                </Button>
              )}
            </div>
          )}

          <FieldDescription className="text-center">
            <Link href="/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}
