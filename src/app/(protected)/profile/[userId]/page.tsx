import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, timezone")
    .eq("id", userId)
    .maybeSingle();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{profile?.display_name || "User"}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{profile?.bio || "No bio yet."}</p>
        <p className="mt-2 text-xs text-muted-foreground">Timezone: {profile?.timezone || "Not set"}</p>
      </CardContent>
    </Card>
  );
}
