import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MessageThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Message thread with user: {userId}</CardContent>
    </Card>
  );
}
