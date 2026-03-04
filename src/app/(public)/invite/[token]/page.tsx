import Link from "next/link";

import { AcceptInviteButton } from "@/components/projects/accept-invite-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InviteTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Project Invitation</CardTitle>
          <CardDescription>Accept to join this project workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-md border bg-muted/50 p-3 text-xs">Token: {token}</p>
          <AcceptInviteButton token={token} />
          <p className="text-sm text-muted-foreground">
            Need an account first? <Link className="text-primary underline" href="/register">Register</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
