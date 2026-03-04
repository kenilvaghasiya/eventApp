"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { actionErr, actionOk, safeAction, type ActionResult } from "@/lib/action";
import { getEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authSchema,
  chatSchema,
  commentSchema,
  invitationSchema,
  profileSchema,
  projectSchema,
  ticketSchema,
  type AuthInput,
  type ChatInput,
  type CommentInput,
  type InvitationInput,
  type ProfileInput,
  type ProjectInput,
  type TicketInput
} from "@/lib/validations";

function mapAuthError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("invalid login credentials")) return "Invalid email or password.";
  if (value.includes("email not confirmed")) return "Please verify your email before logging in.";
  if (value.includes("database error saving new user")) {
    return "Could not create account because profile setup failed. Run schema.sql and verify the profiles trigger in Supabase.";
  }
  if (value.includes("signup is disabled")) return "Email signup is disabled in Supabase Auth settings.";
  return `Authentication failed: ${message}`;
}

export async function registerAction(input: AuthInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = authSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid input", "VALIDATION");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password });
    if (error) return actionErr(mapAuthError(error.message));
    return actionOk(null, "Account created. Check your inbox for verification.");
  });
}

export async function loginAction(input: AuthInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = authSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid input", "VALIDATION");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    if (error) return actionErr(mapAuthError(error.message), "UNAUTHORIZED");
    return actionOk(null, "Welcome back.");
  });
}

export async function loginWithGoogleAction(): Promise<ActionResult<{ url: string }>> {
  return safeAction(async () => {
    const env = getEnv();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${env.appUrl}/auth/callback` }
    });

    if (error || !data.url) return actionErr("Unable to start Google login.");
    return actionOk({ url: data.url });
  });
}

export async function magicLinkAction(email: string): Promise<ActionResult<null>> {
  return safeAction(async () => {
    if (!email) return actionErr("Please enter your email.", "VALIDATION");
    const env = getEnv();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${env.appUrl}/dashboard` } });
    if (error) return actionErr("Could not send magic link.");
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

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return actionErr("Please login again.", "UNAUTHORIZED");

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.displayName,
        bio: parsed.data.bio ?? null,
        timezone: parsed.data.timezone ?? null
      })
      .eq("id", user.id);

    if (error) return actionErr("Could not update profile.");
    revalidatePath("/profile");
    return actionOk(null, "Profile updated.");
  });
}

export async function createProjectAction(input: ProjectInput): Promise<ActionResult<{ projectId: string }>> {
  return safeAction(async () => {
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid project data", "VALIDATION");

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return actionErr("Please login again.", "UNAUTHORIZED");

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        key_prefix: parsed.data.keyPrefix,
        owner_id: user.id,
        color: parsed.data.color ?? null,
        emoji: parsed.data.emoji ?? null,
        start_date: parsed.data.startDate || null,
        end_date: parsed.data.endDate || null
      })
      .select("id")
      .single();

    if (error || !project) return actionErr("Could not create project.");

    await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role: "owner",
      joined_at: new Date().toISOString()
    });

    revalidatePath("/dashboard");
    return actionOk({ projectId: project.id }, "Project created.");
  });
}

export async function inviteMemberAction(input: InvitationInput): Promise<ActionResult<{ token: string }>> {
  return safeAction(async () => {
    const parsed = invitationSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid invite data", "VALIDATION");

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return actionErr("Please login again.", "UNAUTHORIZED");

    const token = randomUUID();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("invitations").insert({
      project_id: parsed.data.projectId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      expires_at: expires,
      invited_by: user.id
    });
    if (error) return actionErr("Could not create invitation.");

    revalidatePath(`/projects/${parsed.data.projectId}/members`);
    return actionOk({ token }, "Invitation created. Connect Resend to send email automatically.");
  });
}

export async function acceptInvitationAction(token: string): Promise<ActionResult<{ projectId: string }>> {
  return safeAction(async () => {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return actionErr("Please login first.", "UNAUTHORIZED");

    const { data: invite } = await supabase.from("invitations").select("*").eq("token", token).maybeSingle();
    if (!invite) return actionErr("Invitation not found.", "NOT_FOUND");
    if (invite.accepted_at) return actionErr("Invitation already accepted.", "FORBIDDEN");
    if (new Date(invite.expires_at).getTime() < Date.now()) return actionErr("Invitation has expired.", "FORBIDDEN");

    await supabase.from("project_members").upsert({
      project_id: invite.project_id,
      user_id: user.id,
      role: invite.role,
      joined_at: new Date().toISOString()
    });

    await supabase.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

    revalidatePath("/dashboard");
    return actionOk({ projectId: invite.project_id }, "Invitation accepted.");
  });
}

export async function createTicketAction(input: TicketInput): Promise<ActionResult<{ ticketId: string }>> {
  return safeAction(async () => {
    const parsed = ticketSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid ticket data", "VALIDATION");

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return actionErr("Please login again.", "UNAUTHORIZED");

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
        reporter_id: user.id,
        due_date: parsed.data.dueDate || null,
        estimate: parsed.data.estimate ?? null
      })
      .select("id")
      .single();

    if (error || !ticket) return actionErr("Could not create ticket.");
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

export async function createCommentAction(input: CommentInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = commentSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid comment.", "VALIDATION");

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return actionErr("Please login again.", "UNAUTHORIZED");

    const { error } = await supabase.from("comments").insert({
      ticket_id: parsed.data.ticketId,
      author_id: user.id,
      body: parsed.data.body
    });

    if (error) return actionErr("Could not post comment.");
    return actionOk(null, "Comment added.");
  });
}

export async function sendChatMessageAction(input: ChatInput): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const parsed = chatSchema.safeParse(input);
    if (!parsed.success) return actionErr(parsed.error.issues[0]?.message ?? "Invalid message.", "VALIDATION");

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return actionErr("Please login again.", "UNAUTHORIZED");

    const { error } = await supabase.from("chat_messages").insert({
      project_id: parsed.data.projectId,
      sender_id: user.id,
      body: parsed.data.body
    });

    if (error) return actionErr("Could not send message.");
    revalidatePath(`/projects/${parsed.data.projectId}/chat`);
    return actionOk(null, "Message sent.");
  });
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<null>> {
  return safeAction(async () => {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return actionErr("Please login again.", "UNAUTHORIZED");

    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    if (error) return actionErr("Could not update notifications.");
    revalidatePath("/notifications");
    return actionOk(null, "All notifications marked as read.");
  });
}
