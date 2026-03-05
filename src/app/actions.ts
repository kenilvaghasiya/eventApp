"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { actionErr, actionOk, safeAction, type ActionResult } from "@/lib/action";
import { getEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authSchema,
  chatSchema,
  commentSchema,
  invitationSchema,
  removeMemberSchema,
  profileSchema,
  projectSchema,
  projectSettingsSchema,
  ticketSchema,
  directMessageSchema,
  type AuthInput,
  type ChatInput,
  type CommentInput,
  type DirectMessageInput,
  type InvitationInput,
  type RemoveMemberInput,
  type ProfileInput,
  type ProjectInput,
  type ProjectSettingsInput,
  type TicketInput
} from "@/lib/validations";
import { ticketStatuses } from "@/lib/constants";

function mapAuthError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("invalid login credentials")) return "Invalid email or password.";
  if (value.includes("email not confirmed")) return "Please verify your email before logging in.";
  if (value.includes("database error saving new user")) {
    return "Could not create account because profile setup failed. Run schema.sql and verify the profiles trigger in Supabase.";
  }
  if (value.includes("email rate limit exceeded")) {
    return "Too many auth emails were sent from Supabase. Disable Confirm Email or wait for cooldown, then try again.";
  }
  if (value.includes("signup is disabled")) return "Email signup is disabled in Supabase Auth settings.";
  return `Authentication failed: ${message}`;
}

async function getRequestBaseUrl() {
  const env = getEnv();
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";

  if (host) return `${proto}://${host}`;
  return env.appUrl;
}

async function ensureProfileExists(userId: string, fallbackName?: string | null) {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (existing) return;

  const { error } = await supabase
    .from("profiles")
    .insert({ id: userId, display_name: fallbackName ?? null })
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not initialize profile for this user. Run the latest schema.sql (profiles trigger + profiles_insert_self policy). Details: ${error.message}`
    );
  }
}

async function resolveActorId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    await ensureProfileExists(user.id, user.user_metadata?.full_name ?? user.email ?? null);
    return user.id;
  }

  return null;
}

async function createNotifications(userIds: string[], type: string, referenceId?: string) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (!unique.length) return;

  const supabase = await createSupabaseServerClient();
  const payload = unique.map((userId) => ({
    user_id: userId,
    type,
    reference_id: referenceId ?? null
  }));
  await supabase.from("notifications").insert(payload);
}

async function isProjectOwner(projectId: string, actorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase.from("projects").select("owner_id").eq("id", projectId).maybeSingle();
  if (!project) return false;
  return project.owner_id === actorId;
}

function makeProjectKey(name: string, fallback = "PRJ") {
  const letters = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 4);
  return (letters || fallback).slice(0, 8);
}

async function syncPendingInvitationsForUser(userId: string, email?: string | null) {
  if (!email) return;
  const supabase = await createSupabaseServerClient();

  const { data: invites } = await supabase
    .from("invitations")
    .select("id, project_id, role, accepted_at, expires_at")
    .ilike("email", email);

  if (!invites || invites.length === 0) return;

  const now = Date.now();
  for (const invite of invites) {
    if (invite.accepted_at) continue;
    if (new Date(invite.expires_at).getTime() < now) continue;

    await supabase.from("project_members").upsert({
      project_id: invite.project_id,
      user_id: userId,
      role: invite.role,
      joined_at: new Date().toISOString()
    });
    await supabase.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
  }
}

export async function registerAction(input: AuthInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = authSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid input", "VALIDATION");

    const baseUrl = await getRequestBaseUrl();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback`
      }
    });
    if (error) return actionErr(mapAuthError(error.message));

    if (data.user && !data.session) {
      return actionOk(null, "Account created. You can now login once email confirmation is disabled in Supabase.");
    }

    if (data.user && data.session) {
      await syncPendingInvitationsForUser(data.user.id, data.user.email ?? parsed.data.email);
    }

    return actionOk(null, "Account created. Please login.");
  });
}

export async function loginAction(input: AuthInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = authSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid input", "VALIDATION");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    if (error) return actionErr(mapAuthError(error.message), "UNAUTHORIZED");
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) await syncPendingInvitationsForUser(user.id, user.email ?? parsed.data.email);
    return actionOk(null, "Welcome back.");
  });
}

export async function loginWithGoogleAction(): Promise<ActionResult<{ url: string }>> {
  return safeAction(async () => {
    const baseUrl = await getRequestBaseUrl();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${baseUrl}/auth/callback` }
    });

    if (error || !data.url) return actionErr("Unable to start Google login.");
    return actionOk({ url: data.url });
  });
}

export async function magicLinkAction(email: string): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsedEmail = z.string().email("Please enter a valid email address.").safeParse(email);
    if (!parsedEmail.success) return actionErr(parsedEmail.error.issues[0]?.message ?? "Please enter your email.", "VALIDATION");

    const baseUrl = await getRequestBaseUrl();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsedEmail.data,
      options: { emailRedirectTo: `${baseUrl}/auth/callback?next=/dashboard` }
    });
    if (error) return actionErr(`Could not send magic link: ${error.message}`);
    return actionOk(null, "Magic link sent to your email.");
  });
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid profile data", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.displayName,
        bio: parsed.data.bio ?? null,
        timezone: parsed.data.timezone ?? null
      })
      .eq("id", actorId);

    if (error) return actionErr("Could not update profile.");
    revalidatePath("/profile");
    return actionOk(null, "Profile updated.");
  });
}

export async function createProjectAction(input: ProjectInput): Promise<ActionResult<{ projectId: string }>> {
  return safeAction(async () => {
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid project data", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        key_prefix: parsed.data.keyPrefix?.trim() ? parsed.data.keyPrefix : makeProjectKey(parsed.data.name),
        owner_id: actorId,
        color: parsed.data.color ?? null,
        emoji: parsed.data.emoji?.trim() ? parsed.data.emoji : null,
        start_date: parsed.data.startDate || null,
        end_date: parsed.data.endDate || null
      })
      .select("id")
      .single();

    if (error || !project) {
      const message = error?.message ?? "Could not create project.";
      
      if (message.toLowerCase().includes("violates foreign key constraint") && message.includes("owner_id")) {
        return actionErr(
          "Profile record is missing for this account. Run schema.sql in Supabase and create a profile row for this user before creating a project."
        );
      }
      return actionErr(`${message} (current user id: ${actorId})`);
    }

    const { error: memberError } = await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: actorId,
      role: "owner",
      joined_at: new Date().toISOString()
    });
    if (memberError) {
      await supabase.from("projects").delete().eq("id", project.id);
      return actionErr(
        `Project was created but owner membership failed: ${memberError.message}. Update project_members RLS policy for owner insert.`,
        "FORBIDDEN"
      );
    }

    revalidatePath("/dashboard");
    await createNotifications([actorId], "project_created", project.id);
    return actionOk({ projectId: project.id }, "Project created.");
  });
}

export async function inviteMemberAction(input: InvitationInput): Promise<ActionResult<{ token: string }>> {
  return safeAction(async () => {
    const parsed = invitationSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid invite data", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");
    if (!(await isProjectOwner(parsed.data.projectId, actorId))) {
      return actionErr("Only project owner can invite members.", "FORBIDDEN");
    }

    const supabase = await createSupabaseServerClient();
    const token = randomUUID();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("invitations").insert({
      project_id: parsed.data.projectId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      expires_at: expires,
      invited_by: actorId
    });
    if (error) return actionErr(`Could not create invitation: ${error.message}`);

    // If invited email already belongs to an existing profile, auto-add to project now.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", parsed.data.email)
      .maybeSingle();

    if (existingProfile?.id) {
      await supabase.from("project_members").upsert({
        project_id: parsed.data.projectId,
        user_id: existingProfile.id,
        role: parsed.data.role,
        joined_at: new Date().toISOString()
      });

      await supabase
        .from("invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("token", token);

      await createNotifications([existingProfile.id], "project_invited", parsed.data.projectId);
    }

    revalidatePath(`/projects/${parsed.data.projectId}/members`);
    return actionOk(
      { token },
      existingProfile?.id
        ? "Member already had an account and was added to the project."
        : "Invitation created. User will join after signup/login using this email."
    );
  });
}

export async function removeMemberAction(input: RemoveMemberInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = removeMemberSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid remove member request.", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { data: project } = await supabase.from("projects").select("owner_id").eq("id", parsed.data.projectId).maybeSingle();
    if (!project) return actionErr("Project not found.", "NOT_FOUND");
    if (project.owner_id !== actorId) return actionErr("Only project owner can remove members.", "FORBIDDEN");
    if (parsed.data.memberUserId === project.owner_id) return actionErr("Owner cannot be removed from project.", "FORBIDDEN");

    const { error: memberDeleteError } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", parsed.data.projectId)
      .eq("user_id", parsed.data.memberUserId);
    if (memberDeleteError) return actionErr(`Could not remove member: ${memberDeleteError.message}`);

    // Deassign removed user from project tickets so ownership stays clean.
    const { error: ticketUpdateError } = await supabase
      .from("tickets")
      .update({ assignee_id: null })
      .eq("project_id", parsed.data.projectId)
      .eq("assignee_id", parsed.data.memberUserId);
    if (ticketUpdateError) return actionErr(`Member removed but ticket deassign failed: ${ticketUpdateError.message}`);

    revalidatePath(`/projects/${parsed.data.projectId}/members`);
    revalidatePath(`/projects/${parsed.data.projectId}/tickets`);
    revalidatePath(`/projects/${parsed.data.projectId}/board`);
    return actionOk(null, "Member removed and tickets deassigned.");
  });
}

export async function acceptInvitationAction(token: string): Promise<ActionResult<{ projectId: string }>> {
  return safeAction(async () => {
    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { data: invite } = await supabase.from("invitations").select("*").eq("token", token).maybeSingle();
    if (!invite) return actionErr("Invitation not found.", "NOT_FOUND");
    if (invite.accepted_at) return actionErr("Invitation already accepted.", "FORBIDDEN");
    if (new Date(invite.expires_at).getTime() < Date.now()) return actionErr("Invitation has expired.", "FORBIDDEN");

    await supabase.from("project_members").upsert({
      project_id: invite.project_id,
      user_id: actorId,
      role: invite.role,
      joined_at: new Date().toISOString()
    });

    await supabase.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

    revalidatePath("/dashboard");
    await createNotifications([invite.invited_by], "invite_accepted", invite.project_id);
    return actionOk({ projectId: invite.project_id }, "Invitation accepted.");
  });
}

export async function createTicketAction(input: TicketInput): Promise<ActionResult<{ ticketId: string }>> {
  return safeAction(async () => {
    const parsed = ticketSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid ticket data", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        project_id: parsed.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        status: parsed.data.status,
        priority: parsed.data.priority,
        type: parsed.data.type,
        assignee_id: parsed.data.assigneeId ?? null,
        reporter_id: actorId,
        due_date: parsed.data.dueDate || null,
        estimate: parsed.data.estimate ?? null
      })
      .select("id")
      .single();

    if (error || !ticket) return actionErr("Could not create ticket.");
    if (parsed.data.assigneeId && parsed.data.assigneeId !== actorId) {
      await createNotifications([parsed.data.assigneeId], "ticket_assigned", parsed.data.projectId);
    }
    await createNotifications([actorId], "ticket_created", parsed.data.projectId);
    revalidatePath(`/projects/${parsed.data.projectId}/tickets`);
    return actionOk({ ticketId: ticket.id }, "Ticket created.");
  });
}

export async function updateTicketAction(input: TicketInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = ticketSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid ticket data", "VALIDATION");
    if (!parsed.data.id) return actionErr("Ticket id is required.", "VALIDATION");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("tickets")
      .update({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        status: parsed.data.status,
        priority: parsed.data.priority,
        type: parsed.data.type,
        assignee_id: parsed.data.assigneeId ?? null,
        due_date: parsed.data.dueDate || null,
        estimate: parsed.data.estimate ?? null
      })
      .eq("id", parsed.data.id)
      .eq("project_id", parsed.data.projectId);

    if (error) return actionErr("Could not update ticket.");
    revalidatePath(`/projects/${parsed.data.projectId}/tickets`);
    revalidatePath(`/projects/${parsed.data.projectId}/tickets/${parsed.data.id}`);
    revalidatePath(`/projects/${parsed.data.projectId}/board`);
    return actionOk(null, "Ticket updated.");
  });
}

export async function deleteTicketAction(input: { projectId: string; ticketId: string }): Promise<ActionResult<null>> {
  return safeAction(async () => {
    if (!input.projectId || !input.ticketId) return actionErr("Ticket id is required.", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { data: ticket } = await supabase
      .from("tickets")
      .select("project_id")
      .eq("id", input.ticketId)
      .eq("project_id", input.projectId)
      .maybeSingle();
    if (!ticket) return actionErr("Ticket not found.", "NOT_FOUND");

    const { error } = await supabase.from("tickets").delete().eq("id", input.ticketId).eq("project_id", input.projectId);
    if (error) return actionErr(`Could not delete ticket: ${error.message}`);

    revalidatePath(`/projects/${input.projectId}/tickets`);
    revalidatePath(`/projects/${input.projectId}/board`);
    return actionOk(null, "Ticket deleted.");
  });
}

export async function createCommentAction(input: CommentInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = commentSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid comment.", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("comments").insert({
      ticket_id: parsed.data.ticketId,
      author_id: actorId,
      body: parsed.data.body
    });

    if (error) return actionErr("Could not post comment.");
    const { data: ticket } = await supabase
      .from("tickets")
      .select("project_id, reporter_id, assignee_id")
      .eq("id", parsed.data.ticketId)
      .maybeSingle();
    if (ticket) {
      const targets = [ticket.reporter_id, ticket.assignee_id].filter((id): id is string => !!id && id !== actorId);
      await createNotifications(targets, "ticket_commented", ticket.project_id);
    }
    return actionOk(null, "Comment added.");
  });
}

export async function sendChatMessageAction(input: ChatInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = chatSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid message.", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("chat_messages").insert({
      project_id: parsed.data.projectId,
      sender_id: actorId,
      body: parsed.data.body
    });

    if (error) return actionErr("Could not send message.");
    const { data: members } = await supabase.from("project_members").select("user_id").eq("project_id", parsed.data.projectId);
    if (members?.length) {
      const targets = members.map((member) => member.user_id).filter((id) => id !== actorId);
      await createNotifications(targets, "project_chat_message", parsed.data.projectId);
    }
    revalidatePath(`/projects/${parsed.data.projectId}/chat`);
    return actionOk(null, "Message sent.");
  });
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", actorId).eq("read", false);
    if (error) return actionErr("Could not update notifications.");
    revalidatePath("/notifications");
    return actionOk(null, "All notifications marked as read.");
  });
}

export async function updateTicketStatusAction(input: {
  projectId: string;
  ticketId: string;
  status: (typeof ticketStatuses)[number];
}): Promise<ActionResult<null>> {
  return safeAction(async () => {
    if (!input.projectId || !input.ticketId || !ticketStatuses.includes(input.status)) {
      return actionErr("Invalid status update payload.", "VALIDATION");
    }

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("tickets")
      .update({ status: input.status })
      .eq("id", input.ticketId)
      .eq("project_id", input.projectId);

    if (error) return actionErr(`Could not update ticket status: ${error.message}`);

    const { data: notifyTicket } = await supabase
      .from("tickets")
      .select("reporter_id, assignee_id")
      .eq("id", input.ticketId)
      .eq("project_id", input.projectId)
      .maybeSingle();
    if (notifyTicket) {
      const targets = [notifyTicket.reporter_id, notifyTicket.assignee_id].filter((id): id is string => !!id && id !== actorId);
      await createNotifications(targets, "ticket_status_changed", input.projectId);
    }

    revalidatePath(`/projects/${input.projectId}/board`);
    revalidatePath(`/projects/${input.projectId}/tickets`);
    return actionOk(null, "Ticket status updated.");
  });
}

export async function updateProjectSettingsAction(input: ProjectSettingsInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = projectSettingsSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid project data.", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { data: project } = await supabase.from("projects").select("owner_id").eq("id", parsed.data.id).maybeSingle();
    if (!project) return actionErr("Project not found.", "NOT_FOUND");
    if (project.owner_id !== actorId) return actionErr("Only owner can update project settings.", "FORBIDDEN");

    const { error } = await supabase
      .from("projects")
      .update({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        color: parsed.data.color ?? null,
        start_date: parsed.data.startDate || null,
        end_date: parsed.data.endDate || null
      })
      .eq("id", parsed.data.id);
    if (error) return actionErr(`Could not update project: ${error.message}`);

    revalidatePath(`/projects/${parsed.data.id}`);
    revalidatePath(`/projects/${parsed.data.id}/settings`);
    revalidatePath("/dashboard");
    return actionOk(null, "Project updated.");
  });
}

export async function deleteProjectAction(projectId: string): Promise<ActionResult<null>> {
  return safeAction(async () => {
    if (!projectId) return actionErr("Project id is required.", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { data: project } = await supabase.from("projects").select("owner_id").eq("id", projectId).maybeSingle();
    if (!project) return actionErr("Project not found.", "NOT_FOUND");
    if (project.owner_id !== actorId) return actionErr("Only owner can delete project.", "FORBIDDEN");

    // Clean project-scoped notifications that use reference_id = projectId.
    await supabase.from("notifications").delete().eq("reference_id", projectId);

    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) return actionErr(`Could not delete project: ${error.message}`);

    revalidatePath("/dashboard");
    return actionOk(null, "Project deleted with all related data.");
  });
}

export async function sendDirectMessageAction(input: DirectMessageInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = directMessageSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid message.", "VALIDATION");

    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: actorId,
      recipient_id: parsed.data.recipientId,
      body: parsed.data.body
    });
    if (error) return actionErr(`Could not send direct message: ${error.message}`);

    await createNotifications([parsed.data.recipientId], "direct_message", actorId);

    revalidatePath("/messages");
    revalidatePath(`/messages/${parsed.data.recipientId}`);
    return actionOk(null, "Message sent.");
  });
}

export async function touchPresenceAction(): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const actorId = await resolveActorId();
    if (!actorId) return actionErr("Please login again.", "UNAUTHORIZED");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", actorId);
    if (error) return actionErr(`Could not update presence: ${error.message}`);
    return actionOk(null);
  });
}
