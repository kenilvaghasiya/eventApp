import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectTickets } from "@/lib/data";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tickets = await getProjectTickets(id);

  const backlog = tickets.filter((t) => t.status === "backlog").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const done = tickets.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Tickets</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{tickets.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Backlog</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{backlog}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>In Progress / Done</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {inProgress} / {done}
          </CardContent>
        </Card>
      </div>

      <Button asChild>
        <Link href={`/projects/${id}/tickets/new`}>Quick Add Ticket</Link>
      </Button>
    </div>
  );
}
