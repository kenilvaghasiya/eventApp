"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "overview", label: "Overview", path: "" },
  { key: "board", label: "Board", path: "/board" },
  { key: "tickets", label: "Tickets", path: "/tickets" },
  { key: "chat", label: "Chat", path: "/chat" },
  { key: "members", label: "Members", path: "/members" },
  { key: "reports", label: "Reports", path: "/reports" },
  { key: "settings", label: "Settings", path: "/settings" }
];

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <div className="mb-6 overflow-x-auto pb-1">
      <div className="inline-flex min-w-full gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 md:min-w-0">
      {tabs.map((tab) => {
        const href = `/projects/${projectId}${tab.path}`;
        const isActive = pathname === href;

        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150",
              "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900",
              isActive && "border-blue-200 bg-blue-600 text-white shadow-sm hover:bg-blue-600 hover:text-white"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      </div>
    </div>
  );
}
