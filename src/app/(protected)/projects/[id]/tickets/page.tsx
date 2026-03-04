import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { labelize } from "@/lib/constants";
import { getProjectTickets } from "@/lib/data";
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
  const tickets = await getProjectTickets(id, { q, status });

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form className="flex flex-1 gap-2">
          <Input name="q" defaultValue={q ?? ""} placeholder="Search ticket title..." />
          <Input name="status" defaultValue={status ?? ""} placeholder="Filter status (e.g. todo)" className="max-w-52" />
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
        <Button asChild>
          <Link href={`/projects/${id}/tickets/new`}>Create Ticket</Link>
        </Button>
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
