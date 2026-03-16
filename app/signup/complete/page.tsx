import { Suspense } from "react";
import { SignupCompleteClient } from "./signup-complete-client";

export default function SignupCompletePage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Suspense
        fallback={
          <div className="w-full max-w-xs text-center text-sm text-muted-foreground">
            Preparing your checkout...
          </div>
        }
      >
        <SignupCompleteClient />
      </Suspense>
    </div>
  );
}
