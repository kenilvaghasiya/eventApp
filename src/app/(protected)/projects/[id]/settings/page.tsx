import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Settings</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Project rename/archive/delete actions can be added here based on owner role checks.
      </CardContent>
    </Card>
  );
}
