import Link from "next/link";
import { BarChart3, CalendarDays, CircleCheckBig, Users } from "lucide-react";

import { NewProjectModalButton } from "@/components/projects/new-project-modal-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyProjects } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const projects = await getMyProjects();
  const query = (q ?? "").trim().toLowerCase();
  const filteredProjects = query
    ? projects.filter((project) =>
        [project.name, project.description ?? "", project.key_prefix].join(" ").toLowerCase().includes(query)
      )
    : projects;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Hello, welcome back</h1>
          <p className="mt-1 text-slate-500">Let&apos;s organize your tasks, projects, and team updates.</p>
        </div>
      
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Projects</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{filteredProjects.length}</p>
            </div>
            <BarChart3 className="h-6 w-6 text-indigo-600" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Team</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{filteredProjects.filter((p) => p.role !== "viewer").length}</p>
            </div>
            <Users className="h-6 w-6 text-cyan-600" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Done</p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {filteredProjects.length ? Math.max(1, Math.floor(filteredProjects.length / 2)) : 0}
              </p>
            </div>
            <CircleCheckBig className="h-6 w-6 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Upcoming</p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {filteredProjects.length ? Math.max(1, Math.ceil(filteredProjects.length / 3)) : 0}
              </p>
            </div>
            <CalendarDays className="h-6 w-6 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <NewProjectModalButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="rounded-2xl border-slate-200 shadow-none">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription>
                    {project.key_prefix} • {project.role}
                  </CardDescription>
                </div>
                <Badge className="rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-50">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-2 text-sm text-slate-600">{project.description || "No description yet."}</p>
              <p className="text-xs text-slate-500">Created {formatDateTime(project.created_at)}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href={`/projects/${project.id}`}>Open</Link>
                </Button>
                <Button asChild variant="ghost" className="rounded-xl">
                  <Link href={`/projects/${project.id}/members`}>Members</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {query ? "No projects found for your search." : "No projects yet. Create one to get started."}
        </p>
      )}
    </section>
  );
}
