import { CreateEventModal } from "@/components/events/create-event-modal";
import { DashboardFilters } from "@/components/events/dashboard-filters";
import { EventList } from "@/components/events/event-list";
import { PaginationControls } from "@/components/events/pagination-controls";
import { getEvents, getSportTypes, getSportOptions } from "@/lib/events";

interface DashboardPageProps {
  searchParams: Promise<{ search?: string; sport?: string; date?: string; location?: string; page?: string; view?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const [events, sports, sportOptions] = await Promise.all([
    getEvents({ search: params.search, sport: params.sport, date: params.date, location: params.location }),
    getSportTypes(),
    getSportOptions()
  ]);
  const viewMode = params.view === "table" ? "table" : "card";
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const rawPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(rawPage) ? Math.min(Math.max(Math.floor(rawPage), 1), totalPages) : 1;
  const start = (currentPage - 1) * pageSize;
  const paginatedEvents = events.slice(start, start + pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sports Events Dashboard</h1>
          <p className="text-sm text-muted-foreground">Search, filter, and manage all your events.</p>
        </div>
        <CreateEventModal sportOptions={sportOptions} />
      </div>

      <DashboardFilters sports={sports} viewMode={viewMode} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing {paginatedEvents.length} of {events.length} events
        </p>
      </div>
      <EventList events={paginatedEvents} viewMode={viewMode} />
      <PaginationControls currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
