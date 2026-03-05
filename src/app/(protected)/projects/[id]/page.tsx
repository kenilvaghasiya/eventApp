import { QuickAddTicketModal } from "@/components/tickets/quick-add-ticket-modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectChat, getProjectMembers, getProjectTickets } from "@/lib/data";
import { formatDateTime } from "@/lib/date";
import { labelize, ticketStatuses } from "@/lib/constants";

function startOfDay(input: Date) {
  return new Date(input.getFullYear(), input.getMonth(), input.getDate());
}

function buildLast7Days() {
  const days: Array<{ key: string; label: string; start: Date; end: Date }> = [];
  const now = new Date();
  const today = startOfDay(now);

  for (let index = 6; index >= 0; index -= 1) {
    const start = new Date(today);
    start.setDate(today.getDate() - index);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    days.push({
      key: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString(undefined, { weekday: "short" }),
      start,
      end
    });
  }
  return days;
}

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tickets, members, chatMessages] = await Promise.all([
    getProjectTickets(id),
    getProjectMembers(id),
    getProjectChat(id)
  ]);

  const assignees = members.map((member) => ({
    id: member.user_id,
    display_name: member.profiles?.display_name ?? null
  }));

  const backlog = tickets.filter((ticket) => ticket.status === "backlog").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const done = tickets.filter((t) => t.status === "done").length;
  const cancelled = tickets.filter((ticket) => ticket.status === "cancelled").length;
  const openTickets = tickets.filter((ticket) => ticket.status !== "done" && ticket.status !== "cancelled").length;
  const completionRate = tickets.length === 0 ? 0 : Math.round((done / tickets.length) * 100);
  const avgTicketsPerMember = members.length === 0 ? 0 : Number((tickets.length / members.length).toFixed(1));
  const activeAssignees = new Set(tickets.filter((ticket) => ticket.assignee_id).map((ticket) => ticket.assignee_id)).size;

  const statusCounts = ticketStatuses.map((status) => ({
    status,
    label: labelize(status),
    value: tickets.filter((ticket) => ticket.status === status).length
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map((item) => item.value));

  const priorityOrder = ["critical", "high", "medium", "low"] as const;
  const priorityCounts = priorityOrder.map((priority) => ({
    priority,
    label: labelize(priority),
    value: tickets.filter((ticket) => ticket.priority === priority).length
  }));
  const totalPriority = Math.max(1, priorityCounts.reduce((acc, item) => acc + item.value, 0));

  const last7Days = buildLast7Days();
  const dailyActivity = last7Days.map((day) => {
    const ticketsCount = tickets.filter((ticket) => {
      const createdAt = new Date(ticket.created_at);
      return createdAt >= day.start && createdAt < day.end;
    }).length;
    const chatCount = chatMessages.filter((message) => {
      const createdAt = new Date(message.created_at);
      return createdAt >= day.start && createdAt < day.end;
    }).length;
    return {
      ...day,
      tickets: ticketsCount,
      chat: chatCount,
      total: ticketsCount + chatCount
    };
  });
  const maxDaily = Math.max(1, ...dailyActivity.map((item) => item.total));

  const recentActivity = [
    ...tickets.slice(0, 4).map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: "Ticket",
      title: ticket.title,
      meta: `#${ticket.ticket_number} • ${labelize(ticket.status)}`,
      createdAt: ticket.updated_at
    })),
    ...chatMessages.slice(-4).map((message) => ({
      id: `chat-${message.id}`,
      type: "Chat",
      title: message.body,
      meta: message.profiles?.display_name ?? "Teammate",
      createdAt: message.created_at
    }))
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

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
            <CardTitle>Open Tickets</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{openTickets}</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{completionRate}%</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Team / Active Assignees</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {members.length} / {activeAssignees}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusCounts.map((item) => (
              <div key={item.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="text-slate-500">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(item.value / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Priority Split</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              {priorityCounts.map((item) => (
                <div
                  key={item.priority}
                  className={
                    item.priority === "critical"
                      ? "bg-rose-500"
                      : item.priority === "high"
                        ? "bg-orange-500"
                        : item.priority === "medium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                  }
                  style={{ width: `${(item.value / totalPriority) * 100}%` }}
                />
              ))}
            </div>
            <div className="space-y-2">
              {priorityCounts.map((item) => (
                <div key={item.priority} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{item.label}</span>
                  <Badge variant="secondary">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>7-Day Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3">
              {dailyActivity.map((day) => (
                <div key={day.key} className="space-y-2 text-center">
                  <div className="flex h-28 items-end justify-center rounded-lg bg-slate-50 p-2">
                    <div
                      className="w-7 rounded-md bg-blue-500/90"
                      style={{ height: `${Math.max(8, (day.total / maxDaily) * 100)}%` }}
                      title={`${day.tickets} tickets, ${day.chat} chats`}
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-600">{day.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Project Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Backlog</span>
              <span className="font-semibold text-slate-900">{backlog}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>In Progress</span>
              <span className="font-semibold text-slate-900">{inProgress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Done</span>
              <span className="font-semibold text-slate-900">{done}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cancelled</span>
              <span className="font-semibold text-slate-900">{cancelled}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg tickets/member</span>
              <span className="font-semibold text-slate-900">{avgTicketsPerMember}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Project chat messages</span>
              <span className="font-semibold text-slate-900">{chatMessages.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
            {recentActivity.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge variant="outline">{activity.type}</Badge>
                  <span className="text-xs text-slate-500">{formatDateTime(activity.createdAt)}</span>
                </div>
                <p className="line-clamp-1 text-sm font-semibold text-slate-900">{activity.title}</p>
                <p className="line-clamp-1 text-xs text-slate-500">{activity.meta}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAddTicketModal projectId={id} assignees={assignees} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
