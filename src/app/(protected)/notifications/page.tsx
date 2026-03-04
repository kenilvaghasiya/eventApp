import { MarkNotificationsReadButton } from "@/components/common/read-notifications-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyNotifications } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

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
          <div key={notification.id} className="rounded-md border p-3">
            <p className="text-sm font-medium">{notification.type}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(notification.created_at)}</p>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
      </CardContent>
    </Card>
  );
}
