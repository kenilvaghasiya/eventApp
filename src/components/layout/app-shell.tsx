import Link from "next/link";

import { LogoutButton } from "@/components/layout/logout-button";

type AppShellProps = {
  children: React.ReactNode;
  email?: string;
};

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/messages", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" }
];

export function AppShell({ children, email }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-lg font-black">
            TaskFlow Pro
          </Link>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-muted-foreground md:block">{email ?? "Unknown user"}</p>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="rounded-lg border bg-white p-2">
          <nav className="grid gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm hover:bg-accent">
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="rounded-lg border bg-white p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
