"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createTicketAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { labelize, ticketPriorities, ticketStatuses, ticketTypes } from "@/lib/constants";
import { ticketSchema, type TicketInput } from "@/lib/validations";

type Props = {
  projectId: string;
  assignees: Array<{ id: string; display_name: string | null }>;
};

export function TicketCreateForm({ projectId, assignees }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      projectId,
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      type: "task",
      assigneeId: null,
      dueDate: "",
      estimate: null
    }
  });

  const onSubmit = (values: TicketInput) => {
    startTransition(async () => {
      const result = await createTicketAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Ticket created");
      router.push(`/projects/${projectId}/tickets/${result.data.ticketId}`);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Build login page" {...field} />
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
                <Textarea placeholder="Add markdown details, acceptance criteria, links..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select {...field}>
                    {ticketStatuses.map((status) => (
                      <option key={status} value={status}>
                        {labelize(status)}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <Select {...field}>
                    {ticketPriorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {labelize(priority)}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select {...field}>
                    {ticketTypes.map((type) => (
                      <option key={type} value={type}>
                        {labelize(type)}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="assigneeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignee</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value || null)}
                  >
                    <option value="">Unassigned</option>
                    {assignees.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.display_name || member.id}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimate (points)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Ticket"}
        </Button>
      </form>
    </Form>
  );
}
