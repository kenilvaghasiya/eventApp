"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { sendDirectMessageAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { directMessageSchema, type DirectMessageInput } from "@/lib/validations";

export function DirectMessageForm({ recipientId }: { recipientId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<DirectMessageInput>({
    resolver: zodResolver(directMessageSchema),
    defaultValues: { recipientId, body: "" }
  });

  const onSubmit = (values: DirectMessageInput) => {
    startTransition(async () => {
      const result = await sendDirectMessageAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      form.reset({ recipientId, body: "" });
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input placeholder="Write a direct message..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Sending..." : "Send"}
        </Button>
      </form>
    </Form>
  );
}
