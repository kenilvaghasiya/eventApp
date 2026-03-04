import Link from "next/link";

const tabs = [
  { key: "overview", label: "Overview", path: "" },
  { key: "board", label: "Board", path: "/board" },
  { key: "tickets", label: "Tickets", path: "/tickets" },
  { key: "chat", label: "Chat", path: "/chat" },
  { key: "members", label: "Members", path: "/members" },
  { key: "sprints", label: "Sprints", path: "/sprints" },
  { key: "reports", label: "Reports", path: "/reports" },
  { key: "settings", label: "Settings", path: "/settings" }
];

export function ProjectNav({ projectId }: { projectId: string }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/projects/${projectId}${tab.path}`}
          className="rounded-full border px-3 py-1 text-sm hover:bg-accent"
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
