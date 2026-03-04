"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createCommentAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { commentSchema, type CommentInput } from "@/lib/validations";

export function CommentForm({ ticketId }: { ticketId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: { ticketId, body: "" }
  });

  const onSubmit = (values: CommentInput) => {
    startTransition(async () => {
      const result = await createCommentAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Comment added");
      form.reset({ ticketId, body: "" });
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Add Comment *</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="Write your update..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Posting..." : "Post Comment"}
        </Button>
      </form>
    </Form>
  );
}
