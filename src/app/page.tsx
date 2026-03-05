import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getEnv } from "@/lib/env";

export default function LandingPage() {
  if (getEnv().disableAuth) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">TaskFlow Pro</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Ship projects faster with one shared workspace.</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Plan projects, invite your team, track tickets, and collaborate in real-time with a clean workflow.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/register">Create account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
