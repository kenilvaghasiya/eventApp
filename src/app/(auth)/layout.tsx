export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-white md:grid-cols-2">
      <section className="hidden bg-[radial-gradient(circle_at_20%_20%,#60a5fa_0,#1e3a8a_55%,#0b1220_100%)] p-12 text-white md:flex md:flex-col md:justify-between">
        <div className="text-3xl font-black tracking-tight">TaskFlow Pro</div>
        <div>
          <h2 className="max-w-sm text-3xl font-bold">Ship together, faster.</h2>
          <p className="mt-3 max-w-sm text-blue-100">Track projects, tickets, chats, and team activity in one secure workspace.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 md:p-10">{children}</section>
    </main>
  );
}
