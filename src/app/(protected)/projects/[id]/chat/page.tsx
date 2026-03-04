import { ChatComposer } from "@/components/projects/chat-composer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectChat } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

export default async function ProjectChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await getProjectChat(id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-md border p-3">
          {messages.map((message) => (
            <div key={message.id} className="rounded-md border bg-muted/40 p-2 text-sm">
              <p className="font-semibold">{message.profiles?.display_name || "Teammate"}</p>
              <p>{message.body}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
        </div>
        <ChatComposer projectId={id} />
      </CardContent>
    </Card>
  );
}
