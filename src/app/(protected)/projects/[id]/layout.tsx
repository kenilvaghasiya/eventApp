import { notFound } from "next/navigation";

import { ProjectNav } from "@/components/projects/project-nav";
import { getProjectById } from "@/lib/data";

export default async function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <section>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-sm text-muted-foreground">
          {project.key_prefix} • Role: {project.role}
        </p>
      </div>
      <ProjectNav projectId={id} />
      {children}
    </section>
  );
}
