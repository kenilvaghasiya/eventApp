import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectSprintsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprints</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Sprint planning and active sprint boards are supported by schema and can be expanded from this page.
      </CardContent>
    </Card>
  );
}
