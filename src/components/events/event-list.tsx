import Link from "next/link";
import { ImageIcon } from "lucide-react";

import { DeleteEventButton } from "@/components/events/delete-event-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEventDate } from "@/lib/date";
import type { EventWithVenues } from "@/db/types";

interface EventListProps {
  events: EventWithVenues[];
  viewMode: "card" | "table";
}

export function EventList({ events, viewMode }: EventListProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No events found. Create your first sports event.</p>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === "table") {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Image</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Sport</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Location</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t align-top">
                    <td className="px-4 py-3">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.name} className="h-14 w-20 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-100">
                          <ImageIcon className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{event.name}</td>
                    <td className="px-4 py-3">
                      <Badge>{event.sport_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatEventDate(event.event_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {event.venues[0] ? `${event.venues[0].name} - ${event.venues[0].address}` : "No venue"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/events/${event.id}`}>View</Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/events/${event.id}/edit`}>Edit</Link>
                        </Button>
                        <DeleteEventButton eventId={event.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-wrap gap-[30px]">
      {events.map((event) => (
        <Card key={event.id} className="w-full max-w-[300px]">
          {event.image_url ? (
            <img src={event.image_url} alt={event.name} className="h-36 w-full rounded-t-lg object-cover" />
          ) : (
            <div className="relative flex h-36 w-full items-center justify-center rounded-t-lg border-b border-dashed border-slate-300 bg-slate-100">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(148,163,184,0.12)_25%,transparent_25%,transparent_50%,rgba(148,163,184,0.12)_50%,rgba(148,163,184,0.12)_75%,transparent_75%,transparent)] bg-[length:20px_20px]" />
              <ImageIcon className="relative z-10 h-8 w-8 text-slate-400" />
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{event.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Badge>{event.sport_type}</Badge>
              <p className="text-sm text-muted-foreground">{formatEventDate(event.event_at)}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {(event.description || "No description provided.").slice(0, 120)}
              {(event.description || "").length > 120 ? "..." : ""}
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Venues</p>
              {event.venues.slice(0, 1).map((venue) => (
                <p key={venue.id} className="text-sm text-muted-foreground">
                  {venue.name} - {venue.address}
                </p>
              ))}
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/events/${event.id}`}>View</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/events/${event.id}/edit`}>Edit</Link>
              </Button>
              <DeleteEventButton eventId={event.id} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
