"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { inviteMemberAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { inviteRoles, labelize } from "@/lib/constants";
import { invitationSchema, type InvitationInput } from "@/lib/validations";

export function InviteMemberForm({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<InvitationInput>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { projectId, email: "", role: "developer" }
  });

  const onSubmit = (values: InvitationInput) => {
    startTransition(async () => {
      const result = await inviteMemberAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitation created. Share this token:", { description: result.data.token });
      form.reset({ projectId, email: "", role: "developer" });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="teammate@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role *</FormLabel>
              <FormControl>
                <Select {...field}>
                  {inviteRoles.map((role) => (
                    <option key={role} value={role}>
                      {labelize(role)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Inviting..." : "Invite"}
        </Button>
      </form>
    </Form>
  );
}
