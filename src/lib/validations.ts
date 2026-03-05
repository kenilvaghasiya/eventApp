import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters.")
});

export const profileSchema = z.object({
  displayName: z.string().min(2, "Display name is required."),
  bio: z.string().max(500).optional(),
  timezone: z.string().optional()
});

export const projectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Project name is required."),
  description: z.string().optional(),
  keyPrefix: z
    .string()
    .max(8)
    .regex(/^[A-Z0-9]+$/, "Project key must be uppercase letters/numbers only.")
    .optional()
    .or(z.literal("")),
  color: z.string().optional(),
  emoji: z.string().optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export const projectSettingsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Project name is required."),
  description: z.string().optional(),
  color: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export const invitationSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email("Please enter a valid email."),
  role: z.enum(["admin", "developer", "viewer"])
});

export const ticketSchema = z.object({
  id: z.string().uuid().optional(),
  projectId: z.string().uuid(),
  title: z.string().min(2, "Ticket title is required."),
  description: z.string().optional(),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "cancelled"]),
  priority: z.enum(["critical", "high", "medium", "low", "none"]),
  type: z.enum(["bug", "feature", "task", "improvement", "question", "epic"]),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional(),
  estimate: z.number().int().optional().nullable()
});

export const commentSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().min(1, "Comment cannot be empty.")
});

export const chatSchema = z.object({
  projectId: z.string().uuid(),
  body: z.string().min(1, "Message cannot be empty.")
});

export const directMessageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().min(1, "Message cannot be empty.")
});

export type AuthInput = z.infer<typeof authSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectSettingsInput = z.infer<typeof projectSettingsSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
export type TicketInput = z.infer<typeof ticketSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type DirectMessageInput = z.infer<typeof directMessageSchema>;
