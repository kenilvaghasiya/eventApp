"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTicketStatusAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labelize, ticketStatuses } from "@/lib/constants";

type Ticket = {
  id: string;
  title: string;
  status: (typeof ticketStatuses)[number];
  priority: string;
  ticket_number: number;
};

type Props = {
  projectId: string;
  initialTickets: Ticket[];
};

export function BoardDnd({ projectId, initialTickets }: Props) {
  const [tickets, setTickets] = useState(initialTickets);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ticketMap = useMemo(() => new Map(tickets.map((t) => [t.id, t])), [tickets]);

  const handleDrop = (nextStatus: (typeof ticketStatuses)[number]) => {
    if (!draggingId) return;
    const dragged = ticketMap.get(draggingId);
    if (!dragged || dragged.status === nextStatus) {
      setDraggingId(null);
      return;
    }

    const previous = tickets;
    const optimistic = tickets.map((ticket) =>
      ticket.id === draggingId ? { ...ticket, status: nextStatus } : ticket
    );
    setTickets(optimistic);
    setDraggingId(null);

    startTransition(async () => {
      const result = await updateTicketStatusAction({
        projectId,
        ticketId: draggingId,
        status: nextStatus
      });

      if (!result.ok) {
        setTickets(previous);
        toast.error(result.error);
        return;
      }

      toast.success("Status updated");
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {ticketStatuses.map((status) => {
        const items = tickets.filter((ticket) => ticket.status === status);
        return (
          <Card
            key={status}
            className="min-h-40"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(status)}
          >
            <CardHeader>
              <CardTitle className="text-base">
                {labelize(status)} {isPending ? "..." : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((ticket) => (
                <div
                  key={ticket.id}
                  draggable
                  onDragStart={() => setDraggingId(ticket.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className="rounded-md border bg-white p-2 text-sm shadow-sm"
                >
                  <Link href={`/projects/${projectId}/tickets/${ticket.id}`} className="block hover:underline">
                    <p className="font-medium">{ticket.title}</p>
                  </Link>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>#{ticket.ticket_number}</span>
                    <Badge>{labelize(ticket.priority)}</Badge>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-xs text-muted-foreground">Drop ticket here</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
