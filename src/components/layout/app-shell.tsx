import Link from "next/link";
import { Bell } from "lucide-react";

import { LogoutButton } from "@/components/layout/logout-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopSearchForm } from "@/components/layout/top-search-form";

type AppShellProps = { children: React.ReactNode; email?: string; unreadNotifications?: number };

export function AppShell({ children, email, unreadNotifications = 0 }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-2xl font-black tracking-tight">
            TaskFlow Pro
          </Link>
          <div className="hidden max-w-md flex-1 md:block">
            <TopSearchForm />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
            <div className="hidden text-right md:block">
              <p className="max-w-48 truncate text-sm font-semibold text-slate-800">{email ?? "Unknown user"}</p>
              <p className="text-xs text-slate-500">Workspace User</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="grid w-full grid-cols-1 gap-4 px-2 py-3 sm:px-4 lg:grid-cols-[252px_1fr] lg:px-6">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-[84px]">
          <div className="mb-4 rounded-xl bg-indigo-600/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-indigo-700">
            Task Navigation
          </div>
          <SidebarNav />
        </aside>
        <main className="min-h-[calc(100vh-110px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">{children}</main>
      </div>
    </div>
  );
}
