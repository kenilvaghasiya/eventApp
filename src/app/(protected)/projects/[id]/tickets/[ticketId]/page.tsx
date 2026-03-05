import { notFound } from "next/navigation";

import { CommentForm } from "@/components/tickets/comment-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labelize } from "@/lib/constants";
import { getTicketDetails } from "@/lib/data";
import { formatDateTime } from "@/lib/date";
import { sanitizeRichTextHtml } from "@/lib/rich-text";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string; ticketId: string }> }) {
  const { id, ticketId } = await params;
  const data = await getTicketDetails(id, ticketId);
  if (!data) notFound();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{data.ticket.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{labelize(data.ticket.status)}</Badge>
            <Badge>{labelize(data.ticket.priority)}</Badge>
            <Badge>{labelize(data.ticket.type)}</Badge>
          </div>
          {data.ticket.description ? (
            <div
              className="rich-text-content text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(data.ticket.description) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No description.</p>
          )}
          <p className="text-xs text-muted-foreground">Updated {formatDateTime(data.ticket.updated_at)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.comments.map((comment) => (
            <div key={comment.id} className="rounded-md border p-3">
              <p className="text-sm font-semibold">{comment.profiles?.display_name || "Teammate"}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(comment.created_at)}</p>
            </div>
          ))}
          {data.comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
          <CommentForm ticketId={ticketId} />
        </CardContent>
      </Card>
    </div>
  );
}
