import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ticketStatuses, labelize } from "@/lib/constants";
import { getProjectTickets } from "@/lib/data";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tickets = await getProjectTickets(id);

  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {ticketStatuses.map((status) => {
        const items = tickets.filter((ticket) => ticket.status === status);
        return (
          <Card key={status} className="min-h-40">
            <CardHeader>
              <CardTitle className="text-base">{labelize(status)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((ticket) => (
                <Link key={ticket.id} href={`/projects/${id}/tickets/${ticket.id}`} className="block rounded-md border p-2 text-sm hover:bg-accent">
                  <p className="font-medium">{ticket.title}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>#{ticket.ticket_number}</span>
                    <Badge>{labelize(ticket.priority)}</Badge>
                  </div>
                </Link>
              ))}
              {items.length === 0 && <p className="text-xs text-muted-foreground">No tickets</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
