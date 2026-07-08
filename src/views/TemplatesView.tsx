import { Eye, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { agentTemplates } from "../data/seedData";
import type { AgentTemplate } from "../types";
import { GlassCard } from "../components/GlassCard";

const filters = ["All", "DeFi", "Security", "Research", "Governance", "Automation"];

export function TemplatesView({ onUseTemplate, onPreview }: { onUseTemplate: (template: AgentTemplate) => void; onPreview: (template: AgentTemplate) => void }) {
  const [filter, setFilter] = useState("All");
  const templates = filter === "All" ? agentTemplates : agentTemplates.filter((template) => template.category === filter);

  return (
    <main className="view-stage">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-slate-50">Agent Templates Library</h1>
        <p className="mt-1 text-sm text-slate-400">Reusable blueprints for loading Foundry profiles before registration or launch.</p>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={filter === item ? "chip-active" : "chip"}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {templates.map((template, index) => (
          <motion.div key={template.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}>
            <GlassCard className="flex h-full flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-blue-300/16 bg-blue-500/10 text-blue-100">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-ritual-violet/20 bg-ritual-violet/10 px-2 py-1 text-[11px] text-violet-200">{template.category}</span>
              </div>
              <h2 className="mt-4 font-semibold text-slate-100">{template.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{template.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {template.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => onUseTemplate(template)} className="small-action flex-1 justify-center">Use Template</button>
                <button onClick={() => onPreview(template)} className="small-action"><Eye className="h-3.5 w-3.5" /> Preview</button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
