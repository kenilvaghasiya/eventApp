"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { markAllNotificationsReadAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function MarkNotificationsReadButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        startTransition(async () => {
          const result = await markAllNotificationsReadAction();
          if (!result.ok) {
        toast.error(result.error);
        return;
      }
          toast.success(result.message ?? "Done");
          router.refresh();
        });
      }}
      disabled={isPending}
    >
      {isPending ? "Updating..." : "Mark all read"}
    </Button>
  );
}
