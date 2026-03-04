"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { acceptInvitationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function AcceptInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        startTransition(async () => {
          const result = await acceptInvitationAction(token);
          if (!result.ok) {
        toast.error(result.error);
        return;
      }
          toast.success(result.message ?? "Invitation accepted");
          router.push(`/projects/${result.data.projectId}`);
          router.refresh();
        });
      }}
      disabled={isPending}
      className="w-full"
    >
      {isPending ? "Accepting..." : "Accept invitation"}
    </Button>
  );
}
