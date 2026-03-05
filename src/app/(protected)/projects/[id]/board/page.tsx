import { BoardDnd } from "@/components/projects/board-dnd";
import { getProjectMembers, getProjectTickets } from "@/lib/data";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tickets, members] = await Promise.all([getProjectTickets(id), getProjectMembers(id)]);

  const normalized = tickets.map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    ticket_number: ticket.ticket_number
  }));

  const assignees = members.map((member) => ({
    id: member.user_id,
    display_name: member.profiles?.display_name ?? null
  }));

  return <BoardDnd projectId={id} initialTickets={normalized} assignees={assignees} />;
}
