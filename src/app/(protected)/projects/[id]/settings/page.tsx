import { notFound } from "next/navigation";

import { ProjectSettingsForm } from "@/components/projects/project-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectById } from "@/lib/data";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Project Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <ProjectSettingsForm project={project} />
      </CardContent>
    </Card>
  );
}
