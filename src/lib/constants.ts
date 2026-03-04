export const ticketStatuses = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled"
] as const;

export const ticketPriorities = ["critical", "high", "medium", "low", "none"] as const;
export const ticketTypes = ["bug", "feature", "task", "improvement", "question", "epic"] as const;

export const memberRoles = ["owner", "admin", "developer", "viewer"] as const;
export const inviteRoles = ["admin", "developer", "viewer"] as const;

export function labelize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
