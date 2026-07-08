import { Check, Hexagon } from "lucide-react";
import { motion } from "framer-motion";
import { agentTypes } from "../data/seedData";
import type { AgentTypeId } from "../types";
import { GlassCard } from "./GlassCard";
import { SectionHeader } from "./SectionHeader";
import { cn } from "../lib/cn";

interface AgentTypePanelProps {
  selected: AgentTypeId;
  onSelect: (value: AgentTypeId) => void;
}

export function AgentTypePanel({ selected, onSelect }: AgentTypePanelProps) {
  return (
    <GlassCard className="p-4">
      <SectionHeader number="1" title="Agent Type" subtitle="Choose the foundational nature of your agent." />
      <div className="mt-5 grid gap-3">
        {agentTypes.map((option, index) => {
          const isActive = selected === option.id;
          return (
            <motion.button
              key={option.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -2 }}
              onClick={() => onSelect(option.id)}
              className={cn(
                "relative flex min-h-[100px] items-start gap-3 rounded-lg border p-3 text-left transition",
                isActive
                  ? "border-ritual-violet/70 bg-blue-500/10 shadow-neon-violet"
                  : "border-blue-300/12 bg-slate-950/36 hover:border-blue-300/30",
              )}
            >
              <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-blue-300/20 bg-blue-500/10 text-blue-200">
                <Hexagon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">{option.title}</h3>
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                      isActive ? "border-blue-200 bg-ritual-violet text-white" : "border-slate-500",
                    )}
                  >
                    {isActive ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                </div>
                <span className="mt-1 inline-flex rounded-full bg-ritual-violet/12 px-2 py-0.5 text-[10px] font-medium text-blue-200">
                  {option.tag}
                </span>
                <p className="mt-2 text-xs leading-4 text-slate-400">{option.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </GlassCard>
  );
}
