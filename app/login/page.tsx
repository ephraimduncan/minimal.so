import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { LoginForm } from "@/components/login-form";

async function LoginGuard() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-xs">
        <Suspense>
          <LoginGuard />
        </Suspense>
      </div>
    </div>
  );
}
