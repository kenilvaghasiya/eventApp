"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, FolderKanban, LayoutDashboard, MessageCircle, Settings, User } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects/new", label: "Projects", icon: FolderKanban },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/projects", label: "Reports", icon: BarChart3 },
  { href: "/profile", label: "Settings", icon: Settings }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href + link.label}
            href={link.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition",
              "hover:bg-slate-100 hover:text-slate-900",
              active &&
                "bg-[linear-gradient(90deg,#eef2ff_0%,#e0e7ff_60%,#eef2ff_100%)] text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.18)]"
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
