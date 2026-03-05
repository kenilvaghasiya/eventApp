import { ProfileForm } from "@/components/common/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MyProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, timezone")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="text-3xl">My Profile</CardTitle>
          <CardDescription>Manage your personal details and workspace preferences.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ProfileForm
            defaults={{
              displayName: profile?.display_name ?? "",
              bio: profile?.bio ?? "",
              timezone: profile?.timezone ?? ""
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
