import Link from "next/link";

import { MarkNotificationsReadButton } from "@/components/common/read-notifications-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyNotifications } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

function notificationLabel(type: string) {
  switch (type) {
    case "direct_message":
      return "New direct message";
    case "project_created":
      return "Project created";
    case "project_invited":
      return "You were added to a project";
    case "invite_accepted":
      return "Invitation accepted";
    case "ticket_assigned":
      return "Ticket assigned";
    case "ticket_created":
      return "Ticket created";
    case "ticket_status_changed":
      return "Ticket status changed";
    case "ticket_commented":
      return "New ticket comment";
    case "project_chat_message":
      return "New project chat message";
    default:
      return type;
  }
}

function notificationHref(type: string, ref: string | null) {
  if (!ref) return "/dashboard";
  if (type === "direct_message") return `/messages/${ref}`;
  if (type === "project_created" || type === "project_invited" || type === "invite_accepted") return `/projects/${ref}`;
  if (type === "ticket_assigned" || type === "ticket_created" || type === "ticket_status_changed" || type === "ticket_commented") {
    return `/projects/${ref}/tickets`;
  }
  if (type === "project_chat_message") return `/projects/${ref}/chat`;
  return "/dashboard";
}

export default async function NotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notifications</CardTitle>
        <MarkNotificationsReadButton />
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.map((notification) => (
          <div key={notification.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">{notificationLabel(notification.type)}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(notification.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              {!notification.read && <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />}
              <Button asChild size="sm" variant="outline">
                <Link href={notificationHref(notification.type, notification.reference_id)}>Go</Link>
              </Button>
            </div>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
      </CardContent>
    </Card>
  );
}
