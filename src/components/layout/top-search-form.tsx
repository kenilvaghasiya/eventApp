"use client";

import { Search } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

export function TopSearchForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  return (
    <form action={pathname.startsWith("/dashboard") ? "/dashboard" : pathname} method="get" className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        name="q"
        defaultValue={q}
        className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9"
        placeholder="Search projects..."
      />
    </form>
  );
}
