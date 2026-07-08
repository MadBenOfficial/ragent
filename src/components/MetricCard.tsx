import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

export function MetricCard({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-100">{value}</p>
        </div>
        {icon ? <div className="grid h-10 w-10 place-items-center rounded-lg border border-blue-300/15 bg-blue-500/10 text-blue-200">{icon}</div> : null}
      </div>
    </GlassCard>
  );
}
