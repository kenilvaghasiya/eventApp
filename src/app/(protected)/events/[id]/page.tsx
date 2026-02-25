import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageIcon } from "lucide-react";

import { DeleteEventButton } from "@/components/events/delete-event-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEventDate } from "@/lib/date";
import { getEventById } from "@/lib/events";

interface EventDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <Card>
      {event.image_url ? (
        <img src={event.image_url} alt={event.name} className="h-64 w-full rounded-t-lg object-cover" />
      ) : (
        <div className="relative flex h-64 w-full items-center justify-center rounded-t-lg border-b border-dashed border-slate-300 bg-slate-100">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(148,163,184,0.12)_25%,transparent_25%,transparent_50%,rgba(148,163,184,0.12)_50%,rgba(148,163,184,0.12)_75%,transparent_75%,transparent)] bg-[length:20px_20px]" />
          <ImageIcon className="relative z-10 h-10 w-10 text-slate-400" />
        </div>
      )}
      <CardHeader>
        <CardTitle>{event.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge>{event.sport_type}</Badge>
        <p className="text-sm text-muted-foreground">{formatEventDate(event.event_at)}</p>
        <p>{event.description || "No description provided."}</p>

        <div className="space-y-2">
          <h2 className="font-semibold">Venues</h2>
          {event.venues.map((venue) => (
            <p key={venue.id} className="text-sm text-muted-foreground">
              {venue.name} - {venue.address}
            </p>
          ))}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Back</Link>
          </Button>
          <Button asChild>
            <Link href={`/events/${event.id}/edit`}>Edit</Link>
          </Button>
          <DeleteEventButton eventId={event.id} />
        </div>
      </CardContent>
    </Card>
  );
}
