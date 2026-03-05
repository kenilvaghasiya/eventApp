"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTicketStatusAction } from "@/app/actions";
import { QuickAddTicketModal } from "@/components/tickets/quick-add-ticket-modal";
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
  assignees: Array<{ id: string; display_name: string | null }>;
};

export function BoardDnd({ projectId, initialTickets, assignees }: Props) {
  const [tickets, setTickets] = useState(initialTickets);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverStatus, setHoverStatus] = useState<(typeof ticketStatuses)[number] | null>(null);
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
    setHoverStatus(null);

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

  const priorityClass = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-rose-100 text-rose-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-amber-100 text-amber-700";
      case "low":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">Board</h2>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500">{isPending ? "Updating status..." : "Drag and drop issues between columns"}</p>
          <QuickAddTicketModal projectId={projectId} assignees={assignees} triggerLabel="Create Ticket" triggerSize="sm" />
        </div>
      </div>

      <div className="min-w-0 max-w-full overflow-hidden pb-2">
        <div className="grid grid-cols-6 gap-3">
      {ticketStatuses.map((status) => {
        const items = tickets.filter((ticket) => ticket.status === status);
        return (
            <Card
              key={status}
              className={`min-w-0 border-slate-200 bg-slate-50/70 shadow-none transition ${
                hoverStatus === status ? "ring-2 ring-indigo-300" : ""
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setHoverStatus(status);
              }}
              onDragLeave={() => setHoverStatus((current) => (current === status ? null : current))}
              onDrop={() => handleDrop(status)}
            >
            <CardHeader className="sticky top-0 z-10 rounded-t-xl border-b bg-slate-100/90 pb-3 backdrop-blur">
              <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>{labelize(status)}</span>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{items.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {items.map((ticket) => (
                <div
                  key={ticket.id}
                  draggable
                  onDragStart={() => setDraggingId(ticket.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`rounded-lg border bg-white p-2.5 text-sm shadow-sm transition ${
                    draggingId === ticket.id ? "opacity-60 ring-2 ring-indigo-300" : "hover:shadow-md"
                  }`}
                >
                  <Link href={`/projects/${projectId}/tickets/${ticket.id}`} className="block hover:underline">
                    <p className="line-clamp-2 font-medium text-slate-800">{ticket.title}</p>
                  </Link>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">ISSUE-{ticket.ticket_number}</span>
                    <Badge className={priorityClass(ticket.priority)}>{labelize(ticket.priority)}</Badge>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-3 py-4 text-center text-xs text-slate-400">
                  Drop issue here
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
        </div>
      </div>
    </div>
  );
}
