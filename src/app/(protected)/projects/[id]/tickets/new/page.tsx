import { notFound } from "next/navigation";

import { TicketCreateForm } from "@/components/tickets/ticket-create-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectMembers } from "@/lib/data";

export default async function NewTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const members = await getProjectMembers(id);
  if (!members) notFound();

  const assignees = members.map((member: { user_id: string; profiles: { display_name: string | null } | null }) => ({
    id: member.user_id,
    display_name: member.profiles?.display_name ?? null
  }));

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Create Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <TicketCreateForm projectId={id} assignees={assignees} />
      </CardContent>
    </Card>
  );
}
