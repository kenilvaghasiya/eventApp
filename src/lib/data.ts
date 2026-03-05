import type { User } from "@supabase/supabase-js";

import type { Database } from "@/db/types";
import { ticketStatuses } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectMemberRow = Database["public"]["Tables"]["project_members"]["Row"];
type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
type TicketAttachmentRow = Database["public"]["Tables"]["ticket_attachments"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type DirectMessageRow = Database["public"]["Tables"]["direct_messages"]["Row"];
type SprintRow = Database["public"]["Tables"]["sprints"]["Row"];

type MemberProfile = { display_name: string | null; avatar_url?: string | null };
type MemberWithProfile = ProjectMemberRow & { profiles: MemberProfile | null };
type CommentWithProfile = Database["public"]["Tables"]["comments"]["Row"] & { profiles: MemberProfile | null };
type ChatWithProfile = Database["public"]["Tables"]["chat_messages"]["Row"] & { profiles: MemberProfile | null };
type AttachmentWithProfile = TicketAttachmentRow & { profiles: MemberProfile | null };

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

async function getActorIdForReads() {
  const user = await getCurrentUser();
  if (user) return user.id;
  return null;
}

export async function getMyProjects(): Promise<Array<ProjectRow & { role: ProjectMemberRow["role"] }>> {
  const supabase = await createSupabaseServerClient();
  const actorId = await getActorIdForReads();
  if (!actorId) return [];

  const { data: memberRows } = await supabase.from("project_members").select("project_id, role").eq("user_id", actorId);
  if (!memberRows || memberRows.length === 0) return [];

  const projectIds = memberRows.map((member) => member.project_id);
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description, key_prefix, owner_id, color, emoji, archived, start_date, end_date, created_at")
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  if (!projects) return [];

  return projects.map((project) => ({
    ...project,
    role: memberRows.find((member) => member.project_id === project.id)?.role ?? "viewer"
  }));
}

export async function getProjectById(projectId: string): Promise<(ProjectRow & { role: ProjectMemberRow["role"] }) | null> {
  const supabase = await createSupabaseServerClient();
  const actorId = await getActorIdForReads();
  if (!actorId) return null;

  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", actorId)
    .maybeSingle();
  if (!membership) return null;

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description, key_prefix, owner_id, color, emoji, archived, start_date, end_date, created_at")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return null;
  return { ...project, role: membership.role };
}

export async function getProjectMembers(projectId: string): Promise<MemberWithProfile[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("project_members")
    .select("id, project_id, user_id, role, invited_at, joined_at, profiles:user_id(display_name, avatar_url)")
    .eq("project_id", projectId)
    .order("invited_at", { ascending: true });

  return (data as MemberWithProfile[] | null) ?? [];
}

export async function getProjectTickets(
  projectId: string,
  filters?: { status?: string; q?: string }
): Promise<TicketRow[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("tickets")
    .select(
      "id, project_id, title, description, status, priority, type, assignee_id, reporter_id, parent_id, sprint_id, due_date, estimate, ticket_number, created_at, updated_at"
    )
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (filters?.status) {
    const normalizedStatus = filters.status.toLowerCase().trim().replace(/\s+/g, "_");
    if ((ticketStatuses as readonly string[]).includes(normalizedStatus)) {
      query = query.eq("status", normalizedStatus as TicketRow["status"]);
    }
  }
  if (filters?.q) query = query.ilike("title", `%${filters.q}%`);

  const { data } = await query;
  return data ?? [];
}

export async function getProjectSprints(projectId: string): Promise<SprintRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("sprints")
    .select("id, project_id, name, start_date, end_date, status, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getTicketDetails(projectId: string, ticketId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return null;

  const [commentsRes, activityRes, attachmentsRes] = await Promise.all([
    supabase
      .from("comments")
      .select("id, ticket_id, author_id, body, edited_at, created_at, profiles:author_id(display_name, avatar_url)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
    supabase
      .from("chat_messages")
      .select("id, project_id, sender_id, body, file_url, created_at, profiles:sender_id(display_name, avatar_url)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("ticket_attachments")
      .select("id, ticket_id, uploaded_by, file_name, file_url, storage_path, content_type, file_size, created_at, profiles:uploaded_by(display_name, avatar_url)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false })
  ]);

  return {
    ticket,
    comments: (commentsRes.data as CommentWithProfile[] | null) ?? [],
    recentChat: (activityRes.data as ChatWithProfile[] | null) ?? [],
    attachments: (attachmentsRes.data as AttachmentWithProfile[] | null) ?? []
  };
}

export async function getProjectChat(projectId: string): Promise<ChatWithProfile[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("id, project_id, sender_id, body, file_url, created_at, profiles:sender_id(display_name, avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(200);

  return (data as ChatWithProfile[] | null) ?? [];
}

export async function getMyNotifications(): Promise<NotificationRow[]> {
  const supabase = await createSupabaseServerClient();
  const actorId = await getActorIdForReads();
  if (!actorId) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id, user_id, type, reference_id, read, created_at")
    .eq("user_id", actorId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const actorId = await getActorIdForReads();
  if (!actorId) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", actorId)
    .eq("read", false);

  return count ?? 0;
}

type ProfileLite = { id: string; display_name: string | null; avatar_url: string | null };
export type MessageThread = {
  partner: ProfileLite;
  lastMessage: string;
  lastAt: string;
};

export async function getMessageContacts(): Promise<ProfileLite[]> {
  const supabase = await createSupabaseServerClient();
  const actorId = await getActorIdForReads();
  if (!actorId) return [];

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("sender_id, recipient_id")
    .or(`sender_id.eq.${actorId},recipient_id.eq.${actorId}`)
    .order("created_at", { ascending: false })
    .limit(200);

  const partnerIds = Array.from(
    new Set(
      (messages ?? [])
        .flatMap((row) => [row.sender_id, row.recipient_id])
        .filter((id) => id && id !== actorId)
    )
  );

  if (!partnerIds.length) {
    const { data: members } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("user_id", actorId)
      .limit(1);
    if (!members || members.length === 0) return [];
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", partnerIds.length ? partnerIds : [actorId]);

  return (profiles ?? []).filter((p) => p.id !== actorId);
}

export async function getMessageThreads(): Promise<MessageThread[]> {
  const supabase = await createSupabaseServerClient();
  const actorId = await getActorIdForReads();
  if (!actorId) return [];

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, created_at")
    .or(`sender_id.eq.${actorId},recipient_id.eq.${actorId}`)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (!messages || messages.length === 0) return [];

  const byPartner = new Map<
    string,
    {
      lastMessage: string;
      lastAt: string;
    }
  >();

  for (const message of messages) {
    const partnerId = message.sender_id === actorId ? message.recipient_id : message.sender_id;
    if (!partnerId) continue;
    if (!byPartner.has(partnerId)) {
      byPartner.set(partnerId, {
        lastMessage: message.body,
        lastAt: message.created_at
      });
    }
  }

  const partnerIds = Array.from(byPartner.keys());
  if (partnerIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", partnerIds);

  if (!profiles) return [];

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  return partnerIds
    .map((partnerId) => {
      const profile = profileMap.get(partnerId);
      const thread = byPartner.get(partnerId);
      if (!profile || !thread) return null;
      return {
        partner: profile,
        lastMessage: thread.lastMessage,
        lastAt: thread.lastAt
      } as MessageThread;
    })
    .filter((value): value is MessageThread => value !== null)
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
}

export async function getDirectMessagesWith(userId: string): Promise<DirectMessageRow[]> {
  const supabase = await createSupabaseServerClient();
  const actorId = await getActorIdForReads();
  if (!actorId) return [];

  const { data } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .or(`and(sender_id.eq.${actorId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${actorId})`)
    .order("created_at", { ascending: true })
    .limit(500);

  return data ?? [];
}

export async function getOtherProfiles(limit = 50): Promise<ProfileLite[]> {
  const supabase = await createSupabaseServerClient();
  const actorId = await getActorIdForReads();
  if (!actorId) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .neq("id", actorId)
    .limit(limit);

  return data ?? [];
}

export async function getProfileById(userId: string): Promise<ProfileLite | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  return data ?? null;
}

export async function getOnlineUserIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, last_seen_at")
    .in("id", userIds);

  if (!data) return [];
  const cutoff = Date.now() - 60 * 1000; // active in last 60s
  return data.filter((row) => new Date(row.last_seen_at).getTime() >= cutoff).map((row) => row.id);
}
