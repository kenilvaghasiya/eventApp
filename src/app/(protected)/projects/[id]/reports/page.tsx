import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labelize, ticketStatuses } from "@/lib/constants";
import { getProjectChat, getProjectMembers, getProjectSprints, getProjectTickets } from "@/lib/data";

function startOfDay(input: Date) {
  return new Date(input.getFullYear(), input.getMonth(), input.getDate());
}

function last14Days() {
  const rows: Array<{ key: string; label: string; start: Date; end: Date }> = [];
  const now = new Date();
  const today = startOfDay(now);

  for (let index = 13; index >= 0; index -= 1) {
    const start = new Date(today);
    start.setDate(today.getDate() - index);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    rows.push({
      key: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      start,
      end
    });
  }

  return rows;
}

export default async function ProjectReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tickets, members, chatMessages, sprints] = await Promise.all([
    getProjectTickets(id),
    getProjectMembers(id),
    getProjectChat(id),
    getProjectSprints(id)
  ]);

  const doneCount = tickets.filter((ticket) => ticket.status === "done").length;
  const completionRate = tickets.length === 0 ? 0 : Math.round((doneCount / tickets.length) * 100);
  const activeSprintCount = sprints.filter((sprint) => sprint.status === "active").length;

  const statusRows = ticketStatuses.map((status) => ({
    status,
    label: labelize(status),
    count: tickets.filter((ticket) => ticket.status === status).length
  }));
  const maxStatus = Math.max(1, ...statusRows.map((row) => row.count));

  const priorityKeys = ["critical", "high", "medium", "low", "none"] as const;
  const priorityRows = priorityKeys.map((priority) => ({
    priority,
    label: labelize(priority),
    count: tickets.filter((ticket) => ticket.priority === priority).length
  }));
  const maxPriority = Math.max(1, ...priorityRows.map((row) => row.count));

  const assigneeCounts = new Map<string, number>();
  tickets.forEach((ticket) => {
    if (!ticket.assignee_id) return;
    assigneeCounts.set(ticket.assignee_id, (assigneeCounts.get(ticket.assignee_id) ?? 0) + 1);
  });
  const assigneeRows = members
    .map((member) => ({
      id: member.user_id,
      name: member.profiles?.display_name || member.user_id,
      count: assigneeCounts.get(member.user_id) ?? 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxAssignee = Math.max(1, ...assigneeRows.map((row) => row.count));

  const activity14 = last14Days().map((day) => {
    const createdTickets = tickets.filter((ticket) => {
      const createdAt = new Date(ticket.created_at);
      return createdAt >= day.start && createdAt < day.end;
    }).length;
    const chats = chatMessages.filter((message) => {
      const createdAt = new Date(message.created_at);
      return createdAt >= day.start && createdAt < day.end;
    }).length;

    return {
      ...day,
      createdTickets,
      chats,
      total: createdTickets + chats
    };
  });
  const maxActivity = Math.max(1, ...activity14.map((row) => row.total));

  const sprintHealth = sprints.map((sprint) => {
    const sprintTickets = tickets.filter((ticket) => ticket.sprint_id === sprint.id);
    const done = sprintTickets.filter((ticket) => ticket.status === "done").length;
    const progress = sprintTickets.length === 0 ? 0 : Math.round((done / sprintTickets.length) * 100);
    return { ...sprint, tickets: sprintTickets.length, done, progress };
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Total Tickets</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{tickets.length}</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{completionRate}%</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Project Chat Messages</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{chatMessages.length}</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Active Sprints</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{activeSprintCount}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Status Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusRows.map((row) => (
              <div key={row.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{row.label}</span>
                  <span className="text-slate-500">{row.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(row.count / maxStatus) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Priority Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityRows.map((row) => (
              <div key={row.priority} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{row.label}</span>
                  <Badge variant="secondary">{row.count}</Badge>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={
                      row.priority === "critical"
                        ? "h-2 rounded-full bg-rose-500"
                        : row.priority === "high"
                          ? "h-2 rounded-full bg-orange-500"
                          : row.priority === "medium"
                            ? "h-2 rounded-full bg-amber-500"
                            : row.priority === "low"
                              ? "h-2 rounded-full bg-emerald-500"
                              : "h-2 rounded-full bg-slate-400"
                    }
                    style={{ width: `${(row.count / maxPriority) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>14-Day Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3 md:grid-cols-14">
              {activity14.map((row) => (
                <div key={row.key} className="space-y-2 text-center">
                  <div className="flex h-24 items-end justify-center rounded-md bg-slate-50 p-1.5">
                    <div className="w-5 rounded bg-blue-500/90" style={{ height: `${Math.max(8, (row.total / maxActivity) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500">{row.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Workload by Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assigneeRows.length === 0 && <p className="text-sm text-slate-500">No assignee workload yet.</p>}
            {assigneeRows.map((row) => (
              <div key={row.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="line-clamp-1 max-w-[70%] font-medium text-slate-700">{row.name}</span>
                  <span className="text-slate-500">{row.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(row.count / maxAssignee) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Sprint Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sprintHealth.length === 0 && <p className="text-sm text-slate-500">No sprints to report yet.</p>}
          {sprintHealth.map((sprint) => (
            <div key={sprint.id} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{sprint.name}</p>
                <Badge variant="outline">{sprint.status}</Badge>
              </div>
              <div className="mb-1 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${sprint.progress}%` }} />
              </div>
              <p className="text-xs text-slate-500">
                {sprint.done}/{sprint.tickets} done ({sprint.progress}%)
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
