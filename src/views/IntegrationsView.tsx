import { motion } from "framer-motion";
import { integrations } from "../data/seedData";
import { integrationEffectiveStatus } from "../lib/integrationStore";
import type { IntegrationConfig, IntegrationItem, IntegrationStatus } from "../types";
import { GlassCard } from "../components/GlassCard";
import { StatusBadge } from "../components/StatusBadge";

const sections = ["Data Sources", "Agent Capabilities", "Execution Targets"];

export function IntegrationsView({
  configs,
  onConfigure,
}: {
  configs: Record<string, IntegrationConfig>;
  onConfigure: (integration: IntegrationItem) => void;
}) {
  return (
    <main className="view-stage">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-slate-50">Integration Hub</h1>
        <p className="mt-1 text-sm text-slate-400">Configure external inputs, storage endpoints, callbacks, and launch preflight gates.</p>
      </motion.div>

      {sections.map((section) => (
        <section key={section}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-blue-100">{section}</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {integrations.filter((item) => item.section === section).map((item) => {
              const Icon = item.icon;
              const status = integrationEffectiveStatus(item.id, item.status, configs) as IntegrationStatus;
              return (
                <GlassCard key={item.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-blue-300/16 bg-blue-500/10 text-blue-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-100">{item.name}</h3>
                        <StatusBadge value={status} />
                      </div>
                      <p className="mt-2 text-sm leading-5 text-slate-400">{item.description}</p>
                      {configs[item.id]?.endpoint ? (
                        <p className="mt-2 truncate font-mono text-xs text-slate-500">{configs[item.id].endpoint}</p>
                      ) : null}
                      <button onClick={() => onConfigure(item)} className="small-action mt-4">
                        {status === "Connected" ? "Configure" : status === "Disabled" ? "View" : "Connect"}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
