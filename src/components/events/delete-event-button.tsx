"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteEventAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await deleteEventAction(eventId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(result.message ?? "Deleted");
          router.refresh();
        });
      }}
    >
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
