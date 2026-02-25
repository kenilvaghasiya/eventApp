import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      <div className="grid min-h-screen w-full overflow-hidden bg-white md:grid-cols-2">
        <section className="relative hidden md:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/Rectangle2756.png')" }}
          />
          <div className="absolute inset-0 bg-slate-950/20" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/55 to-transparent" />
          <div className="absolute bottom-8 left-8 text-xs text-white/80">FastBreak Sports Events</div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 md:p-14">{children}</section>
      </div>
    </main>
  );
}
