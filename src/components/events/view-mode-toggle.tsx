"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

interface ViewModeToggleProps {
  viewMode: "card" | "table";
}

export function ViewModeToggle({ viewMode }: ViewModeToggleProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const setViewMode = (nextViewMode: "card" | "table") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextViewMode);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant={viewMode === "card" ? "default" : "outline"} size="sm" onClick={() => setViewMode("card")}>
        Card
      </Button>
      <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
        Table
      </Button>
    </div>
  );
}
