import { notFound } from "next/navigation";

import { EventForm } from "@/components/forms/event-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventById, getSportOptions } from "@/lib/events";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const [event, sportOptions] = await Promise.all([getEventById(id), getSportOptions()]);

  if (!event) {
    notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Event</CardTitle>
        <CardDescription>Update event details and venues.</CardDescription>
      </CardHeader>
      <CardContent>
        <EventForm
          mode="edit"
          sportOptions={sportOptions}
          initialValues={{
            id: event.id,
            name: event.name,
            sportType: event.sport_type,
            eventAt: new Date(event.event_at).toISOString().slice(0, 16),
            description: event.description ?? "",
            imageUrl: event.image_url ?? "",
            imagePath: event.image_path ?? "",
            venues: event.venues.map((venue) => ({
              name: venue.name,
              address: venue.address
            }))
          }}
        />
      </CardContent>
    </Card>
  );
}
