import { InviteMemberForm } from "@/components/projects/invite-member-form";
import { RemoveMemberButton } from "@/components/projects/remove-member-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labelize } from "@/lib/constants";
import { getCurrentUser, getProjectById, getProjectMembers } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

export default async function ProjectMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [members, project, currentUser] = await Promise.all([getProjectMembers(id), getProjectById(id), getCurrentUser()]);
  const canManageMembers = project?.role === "owner";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteMemberForm projectId={id} canInvite={canManageMembers} />
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
              <div className="flex items-center gap-2">
                <Badge>{labelize(member.role)}</Badge>
                {canManageMembers && member.role !== "owner" && member.user_id !== currentUser?.id ? (
                  <RemoveMemberButton
                    projectId={id}
                    memberUserId={member.user_id}
                    memberName={member.profiles?.display_name || member.user_id}
                  />
                ) : null}
              </div>
            </div>
          ))}
          {members.length === 0 && <p className="text-sm text-muted-foreground">No members found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
