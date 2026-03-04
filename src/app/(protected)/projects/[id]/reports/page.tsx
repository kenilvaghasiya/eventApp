import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Add burndown, velocity, and workload charts here (schema-ready for analytics).
      </CardContent>
    </Card>
  );
}
