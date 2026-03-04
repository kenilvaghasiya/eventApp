"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { sendChatMessageAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { chatSchema, type ChatInput } from "@/lib/validations";

export function ChatComposer({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<ChatInput>({
    resolver: zodResolver(chatSchema),
    defaultValues: { projectId, body: "" }
  });

  const onSubmit = (values: ChatInput) => {
    startTransition(async () => {
      const result = await sendChatMessageAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      form.reset({ projectId, body: "" });
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
                <Input placeholder="Write a message..." {...field} />
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
