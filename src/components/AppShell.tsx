import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-bg min-h-dvh overflow-x-hidden bg-void font-body text-slate-100">
      <div className="fixed inset-0 border border-blue-300/10" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_80%_4%,rgba(168,85,247,0.14),transparent_24%),radial-gradient(circle_at_8%_78%,rgba(34,211,238,0.09),transparent_24%)]" />
      <div className="pointer-events-none fixed inset-0 circuit-grid opacity-50" />
      <div className="relative flex min-h-dvh flex-col">{children}</div>
    </div>
  );
}
