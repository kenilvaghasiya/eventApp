"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, LayoutGrid, List, MapPin, Search, Trophy, RotateCcw } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface DashboardFiltersProps {
  sports: string[];
  viewMode: "card" | "table";
}

export function DashboardFilters({ sports, viewMode }: DashboardFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [date, setDate] = useState(searchParams.get("date") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");

  const selectedSport = searchParams.get("sport") ?? "";

  const updateParams = (nextSearch: string, nextDate: string, nextLocation: string, nextSport: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");

    if (nextDate) params.set("date", nextDate);
    else params.delete("date");

    if (nextLocation) params.set("location", nextLocation);
    else params.delete("location");

    if (nextSport) params.set("sport", nextSport);
    else params.delete("sport");

    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  const sportsOptions = useMemo(() => ["", ...sports], [sports]);
  const setViewMode = (nextViewMode: "card" | "table") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextViewMode);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              updateParams(value, date, location, selectedSport);
            }}
            placeholder="Search by event name..."
            className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 pl-9 focus-visible:bg-white"
          />
        </div>

        <div className="relative min-w-0">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="date"
            value={date}
            onChange={(event) => {
              const value = event.target.value;
              setDate(value);
              updateParams(search, value, location, selectedSport);
            }}
            className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 pl-9 pr-2 text-sm focus-visible:bg-white"
          />
        </div>

        <div className="relative min-w-0">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={location}
            onChange={(event) => {
              const value = event.target.value;
              setLocation(value);
              updateParams(search, date, value, selectedSport);
            }}
            placeholder="Search by location..."
            className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 pl-9 focus-visible:bg-white"
          />
        </div>

        <div className="relative min-w-0">
          <Trophy className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Select
            value={selectedSport}
            onChange={(event) => {
              updateParams(search, date, location, event.target.value);
            }}
            className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 pl-9 focus-visible:bg-white"
          >
            {sportsOptions.map((sport) => (
              <option key={sport || "all"} value={sport}>
                {sport || "All Sports"}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("search");
              params.delete("date");
              params.delete("location");
              params.delete("sport");
              params.delete("page");
              router.push(`${pathname}?${params.toString()}`);
              setSearch("");
              setDate("");
              setLocation("");
            }}
            title="Reset filters"
            aria-label="Reset filters"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background p-2.5 text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              viewMode === "card" ? "bg-primary text-primary-foreground" : "border border-input bg-background"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Card</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              viewMode === "table" ? "bg-primary text-primary-foreground" : "border border-input bg-background"
            }`}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>
    </div>
  );
}
