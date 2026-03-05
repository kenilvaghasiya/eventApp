"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { deleteTicketAction, updateTicketAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select } from "@/components/ui/select";
import { labelize, ticketPriorities, ticketStatuses, ticketTypes } from "@/lib/constants";
import { ticketSchema, type TicketInput } from "@/lib/validations";

type Props = {
  projectId: string;
  ticket: {
    id: string;
    title: string;
    description: string | null;
    status: TicketInput["status"];
    priority: TicketInput["priority"];
    type: TicketInput["type"];
    assignee_id: string | null;
    due_date: string | null;
    estimate: number | null;
  };
  assignees: Array<{ id: string; display_name: string | null }>;
};

export function TicketRowActions({ projectId, ticket, assignees }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      id: ticket.id,
      projectId,
      title: ticket.title,
      description: ticket.description ?? "",
      status: ticket.status,
      priority: ticket.priority,
      type: ticket.type,
      assigneeId: ticket.assignee_id,
      dueDate: ticket.due_date ?? "",
      estimate: ticket.estimate ?? null
    }
  });

  const onSubmit = (values: TicketInput) => {
    startTransition(async () => {
      const result = await updateTicketAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Ticket updated");
      setOpen(false);
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!confirm("Delete this ticket?")) return;

    startTransition(async () => {
      const result = await deleteTicketAction({ projectId, ticketId: ticket.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Ticket deleted");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Button size="sm" variant="destructive" onClick={onDelete} disabled={isPending}>
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-slate-200">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Edit Ticket</CardTitle>
                <CardDescription>Update ticket details.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close popup">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
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
                          <RichTextEditor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            placeholder="Update description with rich text..."
                          />
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
                            <Select value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value || null)}>
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
                            <Input type="date" {...field} value={field.value ?? ""} />
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
                          <FormLabel>Estimate</FormLabel>
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
                    {isPending ? "Saving..." : "Save Ticket"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
