import { motion } from "framer-motion";
import type { Capability } from "../types";
import { cn } from "../lib/cn";

interface CapabilityToggleProps {
  capability: Capability;
  onToggle: (id: string) => void;
}

export function CapabilityToggle({ capability, onToggle }: CapabilityToggleProps) {
  const Icon = capability.icon;

  return (
    <motion.button
      type="button"
      onClick={() => onToggle(capability.id)}
      whileHover={{ y: -1 }}
      className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-blue-300/12 bg-slate-950/38 p-3 text-left transition hover:border-blue-300/30"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-blue-300/12 bg-blue-500/10 text-blue-200">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-100">{capability.title}</span>
        <span className="block text-xs leading-4 text-slate-400">{capability.description}</span>
      </span>
      <span
        className={cn(
          "relative h-5 w-10 shrink-0 rounded-full border transition",
          capability.enabled ? "border-blue-300/30 bg-ritual-blue/80 shadow-neon-blue" : "border-slate-600 bg-slate-800",
        )}
        role="switch"
        aria-checked={capability.enabled}
      >
        <motion.span
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow"
          animate={{ left: capability.enabled ? 21 : 2 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
        />
      </span>
    </motion.button>
  );
}
