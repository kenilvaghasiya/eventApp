import { BoardDnd } from "@/components/projects/board-dnd";
import { getProjectTickets } from "@/lib/data";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tickets = await getProjectTickets(id);

  const normalized = tickets.map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    ticket_number: ticket.ticket_number
  }));

  return <BoardDnd projectId={id} initialTickets={normalized} />;
}
