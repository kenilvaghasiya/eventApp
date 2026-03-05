"use client";

import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Quote, Underline } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function RichTextEditor({ value, onChange, placeholder = "Write details...", className }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = value ?? "";
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [value]);

  const run = (command: string, commandValue?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, commandValue);
    onChange(el.innerHTML);
  };

  const onInsertLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    run("createLink", url);
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-input", className)}>
      <div className="flex flex-wrap gap-1 border-b bg-slate-50 p-2">
        <Button type="button" size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => run("bold")}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => run("italic")}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => run("underline")}>
          <Underline className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => run("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => run("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => run("formatBlock", "blockquote")}>
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={onInsertLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className="rte-editor min-h-[140px] p-3 text-sm outline-none"
        onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
        onBlur={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}
