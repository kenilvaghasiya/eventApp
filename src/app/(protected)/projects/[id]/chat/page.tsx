import { ChatComposer } from "@/components/projects/chat-composer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getProjectChat } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

export default async function ProjectChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [messages, currentUser] = await Promise.all([getProjectChat(id), getCurrentUser()]);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-white/80 backdrop-blur">
        <CardTitle className="text-2xl">Project Chat</CardTitle>
        <p className="text-sm text-slate-500">Team conversation for this project</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="max-h-[62vh] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-3 md:p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl border px-3 py-2 text-sm shadow-sm md:max-w-[70%] ${
                  message.sender_id === currentUser?.id
                    ? "border-blue-200 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                <p
                  className={`mb-1 text-xs font-semibold ${
                    message.sender_id === currentUser?.id ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {message.profiles?.display_name || "Teammate"}
                </p>
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p
                  className={`mt-1 text-[11px] ${
                    message.sender_id === currentUser?.id ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {formatDateTime(message.created_at)}
                </p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">No messages yet. Start the conversation.</p>
            </div>
          )}
        </div>
        <ChatComposer projectId={id} />
      </CardContent>
    </Card>
  );
}
