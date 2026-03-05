import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectSprints, getProjectTickets } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

function dateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "No date range";
  if (start && !end) return `${new Date(start).toLocaleDateString()} - Open`;
  if (!start && end) return `Until ${new Date(end).toLocaleDateString()}`;
  return `${new Date(start as string).toLocaleDateString()} - ${new Date(end as string).toLocaleDateString()}`;
}

export default async function ProjectSprintsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sprints, tickets] = await Promise.all([getProjectSprints(id), getProjectTickets(id)]);

  const active = sprints.filter((sprint) => sprint.status === "active").length;
  const planned = sprints.filter((sprint) => sprint.status === "planned").length;
  const completed = sprints.filter((sprint) => sprint.status === "completed").length;
  const unscheduled = tickets.filter((ticket) => !ticket.sprint_id).length;

  const sprintCards = sprints.map((sprint) => {
    const sprintTickets = tickets.filter((ticket) => ticket.sprint_id === sprint.id);
    const doneCount = sprintTickets.filter((ticket) => ticket.status === "done").length;
    const progress = sprintTickets.length === 0 ? 0 : Math.round((doneCount / sprintTickets.length) * 100);
    const overdueCount = sprintTickets.filter(
      (ticket) => ticket.due_date && new Date(ticket.due_date).getTime() < Date.now() && ticket.status !== "done"
    ).length;

    return {
      ...sprint,
      ticketCount: sprintTickets.length,
      doneCount,
      progress,
      overdueCount
    };
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Total Sprints</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{sprints.length}</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Active</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{active}</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Planned / Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {planned} / {completed}
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Unscheduled Tickets</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{unscheduled}</CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Sprint Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sprintCards.length === 0 && <p className="text-sm text-slate-500">No sprints found for this project yet.</p>}
          {sprintCards.map((sprint) => (
            <div key={sprint.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-slate-900">{sprint.name}</p>
                  <p className="text-xs text-slate-500">{dateRange(sprint.start_date, sprint.end_date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{sprint.status}</Badge>
                  <Badge variant="outline">{sprint.ticketCount} tickets</Badge>
                </div>
              </div>

              <div className="mb-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${sprint.progress}%` }} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span>
                  Done {sprint.doneCount}/{sprint.ticketCount} ({sprint.progress}%)
                </span>
                <span>{sprint.overdueCount} overdue</span>
                <span>Created {formatDateTime(sprint.created_at)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
