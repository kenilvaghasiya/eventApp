"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createProjectAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { projectSchema, type ProjectInput } from "@/lib/validations";

export function ProjectCreateForm({ compact = false }: { compact?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      keyPrefix: "",
      description: "",
      emoji: "",
      color: "#2563eb",
      startDate: "",
      endDate: ""
    }
  });

  const onSubmit = (values: ProjectInput) => {
    startTransition(async () => {
      const result = await createProjectAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Project created");
      form.reset();
      router.push(`/projects/${result.data.projectId}`);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name *</FormLabel>
              <FormControl>
                <Input placeholder="TaskFlow Core" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="keyPrefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Key *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="TF"
                    {...field}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    maxLength={8}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emoji"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emoji</FormLabel>
                <FormControl>
                  <Input placeholder="🚀" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!compact && (
          <>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What will this project deliver?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme Color</FormLabel>
                    <FormControl>
                      <Input type="color" className="h-10 p-1" {...field} />
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
                      <Input type="date" {...field} />
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
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        <Button type="submit" className="w-fit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Project"}
        </Button>
      </form>
    </Form>
  );
}
