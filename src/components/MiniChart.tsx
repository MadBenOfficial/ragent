import { motion } from "framer-motion";

export function MiniChart({ title, values }: { title: string; values: number[] }) {
  return (
    <div className="rounded-lg border border-blue-300/12 bg-slate-950/40 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <span className="text-[11px] text-slate-500">Demo telemetry</span>
      </div>
      <div className="flex h-28 items-end gap-2">
        {values.map((value, index) => (
          <motion.div
            key={`${title}-${index}`}
            className="flex-1 rounded-t bg-gradient-to-t from-ritual-blue to-ritual-cyan shadow-neon-blue"
            initial={{ height: 0 }}
            animate={{ height: `${value}%` }}
            transition={{ delay: index * 0.04, duration: 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}
