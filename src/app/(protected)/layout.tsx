import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getEnv } from "@/lib/env";
import { getCurrentUser } from "@/lib/data";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const env = getEnv();
  const user = await getCurrentUser();
  if (!env.disableAuth && !user) redirect("/login");

  return <AppShell email={user?.email ?? "Demo mode"}>{children}</AppShell>;
}
