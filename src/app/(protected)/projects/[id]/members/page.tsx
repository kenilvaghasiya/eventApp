import { InviteMemberForm } from "@/components/projects/invite-member-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labelize } from "@/lib/constants";
import { getProjectMembers } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

export default async function ProjectMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const members = await getProjectMembers(id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteMemberForm projectId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{member.profiles?.display_name || member.user_id}</p>
                <p className="text-xs text-muted-foreground">Joined {member.joined_at ? formatDateTime(member.joined_at) : "Not accepted"}</p>
              </div>
              <Badge>{labelize(member.role)}</Badge>
            </div>
          ))}
          {members.length === 0 && <p className="text-sm text-muted-foreground">No members found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
