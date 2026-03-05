import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser, getUnreadNotificationCount } from "@/lib/data";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const unreadNotifications = await getUnreadNotificationCount();

  return <AppShell email={user.email} unreadNotifications={unreadNotifications}>{children}</AppShell>;
}
