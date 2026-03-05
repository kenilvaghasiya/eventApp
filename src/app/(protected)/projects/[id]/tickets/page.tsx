import Link from "next/link";

import { QuickAddTicketModal } from "@/components/tickets/quick-add-ticket-modal";
import { TicketRowActions } from "@/components/tickets/ticket-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { labelize, ticketStatuses } from "@/lib/constants";
import { getProjectMembers, getProjectTickets } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

export default async function TicketsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { id } = await params;
  const { q, status } = await searchParams;
  const [tickets, members] = await Promise.all([getProjectTickets(id, { q, status }), getProjectMembers(id)]);
  const assignees = members.map((member) => ({ id: member.user_id, display_name: member.profiles?.display_name ?? null }));

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form className="flex flex-1 gap-2">
          <Input name="q" defaultValue={q ?? ""} placeholder="Search ticket title..." />
          <Select name="status" defaultValue={status ?? ""} className="max-w-56">
            <option value="">All Status</option>
            {ticketStatuses.map((item) => (
              <option key={item} value={item}>
                {labelize(item)}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="outline">
            Filter
          </Button>
          <Button asChild type="button" variant="ghost">
            <Link href={`/projects/${id}/tickets`}>Reset</Link>
          </Button>
        </form>
        <QuickAddTicketModal projectId={id} assignees={assignees} triggerLabel="Create Ticket" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Title</th>
                <th className="p-2">Status</th>
                <th className="p-2">Priority</th>
                <th className="p-2">Type</th>
                <th className="p-2">Updated</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b hover:bg-accent/40">
                  <td className="p-2">#{ticket.ticket_number}</td>
                  <td className="p-2 font-medium">
                    <Link href={`/projects/${id}/tickets/${ticket.id}`} className="hover:underline">
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="p-2">
                    <Badge>{labelize(ticket.status)}</Badge>
                  </td>
                  <td className="p-2">{labelize(ticket.priority)}</td>
                  <td className="p-2">{labelize(ticket.type)}</td>
                  <td className="p-2 text-muted-foreground">{formatDateTime(ticket.updated_at)}</td>
                  <td className="p-2">
                    <TicketRowActions
                      projectId={id}
                      ticket={{
                        id: ticket.id,
                        title: ticket.title,
                        description: ticket.description,
                        status: ticket.status,
                        priority: ticket.priority,
                        type: ticket.type,
                        assignee_id: ticket.assignee_id,
                        due_date: ticket.due_date,
                        estimate: ticket.estimate
                      }}
                      assignees={assignees}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tickets.length === 0 && <p className="p-4 text-muted-foreground">No tickets matched this filter.</p>}
        </CardContent>
      </Card>
    </section>
  );
}
