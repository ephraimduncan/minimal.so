import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { SignupForm } from "@/components/signup-form";

async function SignupGuard() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <SignupForm />;
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-xs">
        <Suspense>
          <SignupGuard />
        </Suspense>
      </div>
    </div>
  );
}
