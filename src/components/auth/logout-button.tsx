"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
          router.push("/login");
          router.refresh();
        });
      }}
      disabled={isPending}
    >
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}
