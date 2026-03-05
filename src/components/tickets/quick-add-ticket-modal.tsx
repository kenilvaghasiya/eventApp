"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { TicketCreateForm } from "@/components/tickets/ticket-create-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  assignees: Array<{ id: string; display_name: string | null }>;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerSize?: "default" | "sm" | "lg" | "icon";
  triggerVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  showPlusIcon?: boolean;
};

export function QuickAddTicketModal({
  projectId,
  assignees,
  triggerLabel = "Quick Add Ticket",
  triggerClassName,
  triggerSize = "default",
  triggerVariant = "default",
  showPlusIcon = true
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size={triggerSize} variant={triggerVariant} className={cn("rounded-xl", triggerClassName)}>
        {showPlusIcon ? <Plus className="h-4 w-4" /> : null}
        {triggerLabel}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-slate-200">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Create Ticket</CardTitle>
                <CardDescription>Add a new ticket to this project.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close popup">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <TicketCreateForm projectId={projectId} assignees={assignees} />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
