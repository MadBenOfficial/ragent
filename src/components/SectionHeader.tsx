import type { ReactNode } from "react";

interface SectionHeaderProps {
  number: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ number, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 gap-3">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ritual-blue/40 bg-ritual-blue/10 font-mono text-sm text-blue-200 shadow-neon-blue">
          {number}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-blue-100">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}
