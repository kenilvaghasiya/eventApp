"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NewProjectModalButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="rounded-xl" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Project
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-slate-200">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Create New Project</CardTitle>
                <CardDescription>Set up a workspace for your team.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close popup">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ProjectCreateForm />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
