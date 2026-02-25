import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[conic-gradient(from_120deg,#f59e0b,#ec4899,#3b82f6,#f59e0b)]">
              <span className="text-lg font-black italic text-white [font-family:Georgia,serif]">F</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">FastBreak</span>
          </Link>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-muted-foreground sm:block">{user.email}</p>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
