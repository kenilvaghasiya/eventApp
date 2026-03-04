import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProjectPage() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
        <CardDescription>Set up a new workspace for your team.</CardDescription>
      </CardHeader>
      <CardContent>
        <ProjectCreateForm />
      </CardContent>
    </Card>
  );
}
