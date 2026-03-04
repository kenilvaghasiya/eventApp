import Link from "next/link";

import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyProjects } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

export default async function DashboardPage() {
  const projects = await getMyProjects();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your projects and quick actions.</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">Create project page</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Create Project</CardTitle>
          <CardDescription>Create without leaving dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectCreateForm compact />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>
                {project.key_prefix} • {project.role}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{project.description || "No description yet."}</p>
              <p className="text-xs text-muted-foreground">Created {formatDateTime(project.created_at)}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/projects/${project.id}`}>Open project</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No projects yet. Create one to get started.</p>
      )}
    </section>
  );
}
