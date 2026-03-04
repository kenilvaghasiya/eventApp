import type { User } from "@supabase/supabase-js";

import type { Database } from "@/db/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectMemberRow = Database["public"]["Tables"]["project_members"]["Row"];
type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

type MemberProfile = { display_name: string | null; avatar_url?: string | null };
type MemberWithProfile = ProjectMemberRow & { profiles: MemberProfile | null };
type CommentWithProfile = Database["public"]["Tables"]["comments"]["Row"] & { profiles: MemberProfile | null };
type ChatWithProfile = Database["public"]["Tables"]["chat_messages"]["Row"] & { profiles: MemberProfile | null };

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function getMyProjects(): Promise<Array<ProjectRow & { role: ProjectMemberRow["role"] }>> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data: memberRows } = await supabase.from("project_members").select("project_id, role").eq("user_id", user.id);
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
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
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

  if (filters?.status) query = query.eq("status", filters.status as TicketRow["status"]);
  if (filters?.q) query = query.ilike("title", `%${filters.q}%`);

  const { data } = await query;
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

  const [commentsRes, activityRes] = await Promise.all([
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
      .limit(10)
  ]);

  return {
    ticket,
    comments: (commentsRes.data as CommentWithProfile[] | null) ?? [],
    recentChat: (activityRes.data as ChatWithProfile[] | null) ?? []
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
  const user = await getCurrentUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id, user_id, type, reference_id, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}
