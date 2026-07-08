import { motion } from "framer-motion";
import { railItems } from "../data/seedData";
import { cn } from "../lib/cn";
import type { RailToolId } from "../types";

interface LeftRailProps {
  activeTool: RailToolId | null;
  onSelect: (tool: RailToolId) => void;
}

export function LeftRail({ activeTool, onSelect }: LeftRailProps) {
  return (
    <aside className="fixed bottom-0 left-0 top-16 z-20 flex w-16 flex-col items-center border-r border-blue-300/10 bg-black/46 py-4 backdrop-blur-xl">
      <div className="flex flex-1 flex-col items-center gap-3">
        {railItems.map(({ id, label, icon: Icon }, index) => {
          const active = activeTool === id;
          return (
          <motion.button
            key={id}
            onClick={() => onSelect(id)}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-lg border text-slate-400 transition",
              active
                ? "border-blue-200/40 bg-gradient-to-br from-ritual-blue to-ritual-violet text-white shadow-neon-violet"
                : "border-blue-300/10 bg-slate-950/50 hover:border-blue-300/30 hover:text-cyan-100",
            )}
            aria-label={label}
            title={label}
          >
            <Icon className="h-5 w-5" />
          </motion.button>
        )})}
      </div>
    </aside>
  );
}
