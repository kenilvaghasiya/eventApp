"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { removeMemberAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

type Props = {
  projectId: string;
  memberUserId: string;
  memberName: string;
};

export function RemoveMemberButton({ projectId, memberUserId, memberName }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onRemove = () => {
    if (!window.confirm(`Remove ${memberName} from this project?`)) return;

    startTransition(async () => {
      const result = await removeMemberAction({ projectId, memberUserId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Member removed.");
      router.refresh();
    });
  };

  return (
    <Button type="button" size="sm" variant="destructive" disabled={isPending} onClick={onRemove}>
      {isPending ? "Removing..." : "Remove"}
    </Button>
  );
}
