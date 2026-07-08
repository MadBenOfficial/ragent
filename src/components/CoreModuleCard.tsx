import { motion } from "framer-motion";
import type { CoreModule } from "../types";
import { cn } from "../lib/cn";

export function CoreModuleCard({ module }: { module: CoreModule }) {
  const Icon = module.icon;

  return (
    <motion.div
      className={cn(
        "core-module absolute z-10 flex h-[72px] w-[178px] items-center gap-3 rounded-lg border border-blue-300/30 bg-slate-950/52 px-4 shadow-neon-blue backdrop-blur-md",
        module.side,
        module.position,
      )}
      initial={{ opacity: 0, x: module.side === "left" ? -24 : 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.28 }}
      whileHover={{ y: -2, scale: 1.015 }}
    >
      <Icon className="h-7 w-7 shrink-0 text-cyan-200" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-100">{module.title}</p>
        {module.lines.map((line) => (
          <p key={line} className="truncate text-[11px] leading-4 text-slate-400">
            {line}
          </p>
        ))}
      </div>
      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-ritual-green shadow-neon-green" />
    </motion.div>
  );
}
