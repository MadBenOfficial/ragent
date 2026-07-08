import { cn } from "../lib/cn";

const styles: Record<string, string> = {
  Active: "border-ritual-green/25 bg-ritual-green/10 text-ritual-green",
  Connected: "border-ritual-green/25 bg-ritual-green/10 text-ritual-green",
  Sleeping: "border-ritual-cyan/25 bg-ritual-cyan/10 text-cyan-200",
  Available: "border-ritual-cyan/25 bg-ritual-cyan/10 text-cyan-200",
  Draft: "border-ritual-violet/25 bg-ritual-violet/10 text-violet-200",
  Experimental: "border-ritual-violet/25 bg-ritual-violet/10 text-violet-200",
  Failed: "border-red-400/25 bg-red-400/10 text-red-300",
  Disabled: "border-slate-600/40 bg-slate-700/10 text-slate-400",
  Enabled: "border-ritual-green/25 bg-ritual-green/10 text-ritual-green",
  Registered: "border-ritual-green/25 bg-ritual-green/10 text-ritual-green",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", styles[value] ?? styles.Draft, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}
