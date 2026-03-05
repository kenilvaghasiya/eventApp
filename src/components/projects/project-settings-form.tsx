"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { deleteProjectAction, updateProjectSettingsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { projectSettingsSchema, type ProjectSettingsInput } from "@/lib/validations";

type Props = {
  project: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    start_date: string | null;
    end_date: string | null;
  };
};

export function ProjectSettingsForm({ project }: Props) {
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const form = useForm<ProjectSettingsInput>({
    resolver: zodResolver(projectSettingsSchema),
    defaultValues: {
      id: project.id,
      name: project.name,
      description: project.description ?? "",
      color: project.color ?? "#2563eb",
      startDate: project.start_date ?? "",
      endDate: project.end_date ?? ""
    }
  });

  const onSubmit = (values: ProjectSettingsInput) => {
    startTransition(async () => {
      const result = await updateProjectSettingsAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Project updated");
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!confirm("Delete this project permanently? This cannot be undone.")) return;

    setDeleting(true);
    startTransition(async () => {
      const result = await deleteProjectAction(project.id);
      setDeleting(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Project deleted");
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={5} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme Color</FormLabel>
                  <FormControl>
                    <Input type="color" className="h-10 p-1" {...field} value={field.value ?? "#2563eb"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h3 className="text-base font-semibold text-red-700">Danger Zone</h3>
        <p className="mt-1 text-sm text-red-600">Delete project and all related data (tickets, comments, members, chat).</p>
        <Button className="mt-3" variant="destructive" disabled={deleting || isPending} onClick={onDelete}>
          {deleting ? "Deleting..." : "Delete Project"}
        </Button>
      </div>
    </div>
  );
}
