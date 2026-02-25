"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { EventForm } from "@/components/forms/event-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CreateEventModalProps {
  sportOptions: string[];
}

export function CreateEventModal({ sportOptions }: CreateEventModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Event</Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white">
            <Card className="flex max-h-[90vh] flex-col border-0 shadow-none">
              <CardHeader className="sticky top-0 z-10 flex-row items-start justify-between gap-4 space-y-0 border-b bg-white">
                <div>
                  <CardTitle>Create Event</CardTitle>
                  <CardDescription>Add event details and one or more venues.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto">
                <EventForm
                  mode="create"
                  sportOptions={sportOptions}
                  redirectToDashboard={false}
                  stickyActions
                  onCancel={() => setOpen(false)}
                  onSuccess={() => setOpen(false)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
