import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MessagesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Direct Messages</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        DM inbox route is ready. Add direct_messages table and thread UI as a follow-up.
      </CardContent>
    </Card>
  );
}
