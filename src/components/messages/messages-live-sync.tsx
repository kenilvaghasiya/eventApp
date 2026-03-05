"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { touchPresenceAction } from "@/app/actions";

export function MessagesLiveSync() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const refreshTimer = setInterval(() => {
      if (active) router.refresh();
    }, 2500);

    const presenceTimer = setInterval(() => {
      void touchPresenceAction();
    }, 20000);

    void touchPresenceAction();

    return () => {
      active = false;
      clearInterval(refreshTimer);
      clearInterval(presenceTimer);
    };
  }, [router]);

  return null;
}
