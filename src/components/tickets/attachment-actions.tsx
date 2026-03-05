"use client";

import Link from "next/link";
import { Download, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTicketAttachmentAction, updateTicketAttachmentAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  projectId: string;
  ticketId: string;
  attachment: {
    id: string;
    file_name: string;
    file_url: string;
  };
};

export function AttachmentActions({ projectId, ticketId, attachment }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(attachment.file_name);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("ticketId", ticketId);
      formData.set("attachmentId", attachment.id);
      formData.set("fileName", name.trim());
      if (file) formData.set("file", file);

      const result = await updateTicketAttachmentAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Attachment updated.");
      setOpen(false);
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!window.confirm("Delete this file?")) return;
    startTransition(async () => {
      const result = await deleteTicketAttachmentAction({
        projectId,
        ticketId,
        attachmentId: attachment.id
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Attachment deleted.");
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Link
          href={attachment.file_url}
          download
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Link>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete} disabled={isPending}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Attachment</h3>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">File Name</label>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Replace File (optional)</label>
                <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </div>
              <p className="text-xs text-slate-500">If you choose a new file, old file will be replaced.</p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
