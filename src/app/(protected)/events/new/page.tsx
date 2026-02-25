import { EventForm } from "@/components/forms/event-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSportOptions } from "@/lib/events";

export default async function NewEventPage() {
  const sportOptions = await getSportOptions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Event</CardTitle>
        <CardDescription>Add event details and one or more venues.</CardDescription>
      </CardHeader>
      <CardContent>
        <EventForm mode="create" sportOptions={sportOptions} />
      </CardContent>
    </Card>
  );
}
