import { CircleAlert, ScrollText } from "lucide-react";
import { motion } from "framer-motion";
import { useRegisteredAgents } from "../hooks/useRegisteredAgents";
import { truncateHex } from "../lib/secrets";
import type { RegisteredAgent } from "../types";
import { GlassCard } from "../components/GlassCard";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";

interface AgentsViewProps {
  onOpenAgent: (agent: RegisteredAgent) => void;
  onOpenLogs: (agent: RegisteredAgent) => void;
}

export function AgentsView({ onOpenAgent, onOpenLogs }: AgentsViewProps) {
  const { agents, error, isControllerConfigured, isLoading } = useRegisteredAgents();
  const sovereignCount = agents.filter((agent) => agent.agentType === "sovereign").length;
  const persistentCount = agents.length - sovereignCount;

  return (
    <main className="view-stage">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-slate-50">Agents Command Center</h1>
        <p className="mt-1 text-sm text-slate-400">Monitor agents registered through your RAgent controller.</p>
      </motion.div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Registered Agents" value={isControllerConfigured ? String(agents.length) : "-"} />
        <MetricCard label="Sovereign" value={isControllerConfigured ? String(sovereignCount) : "-"} />
        <MetricCard label="Persistent" value={isControllerConfigured ? String(persistentCount) : "-"} />
        <MetricCard label="Controller" value={isControllerConfigured ? "Ready" : "Pending"} />
      </div>

      {error && agents.length > 0 ? (
        <EmptyState title="Partial data mode" body={error} />
      ) : null}

      {!isControllerConfigured ? (
        <EmptyState
          title="Controller not deployed"
          body="Deploy RAgentController and set VITE_RAGENT_CONTROLLER to load registered agents from the controller."
        />
      ) : error && agents.length === 0 ? (
        <EmptyState title="Could not load agents" body={error} />
      ) : isLoading ? (
        <EmptyState title="Loading agents" body="Reading your registered agents from RAgentController." />
      ) : agents.length === 0 ? (
        <EmptyState title="No registered agents yet" body="Create and register the first agent from the Foundry when the controller is configured." />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {agents.map((agent, index) => (
          <motion.div key={agent.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <GlassCard className="p-4">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-blue-300/20 bg-blue-500/10 text-blue-100">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-slate-100">{agent.name}</h2>
                      <p className="text-xs text-slate-400">{agent.agentType === "sovereign" ? "Sovereign Agent" : "Persistent Agent"}</p>
                    </div>
                    <StatusBadge value="Registered" />
                  </div>
                  <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
                    <span>ID: <b className="font-mono text-slate-200">{truncateHex(agent.id, 10, 8)}</b></span>
                    <span>Owner: <b className="font-mono text-slate-200">{truncateHex(agent.owner, 8, 6)}</b></span>
                    <span>Block: <b className="font-mono text-slate-200">{agent.blockNumber ?? "-"}</b></span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-950/70">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-ritual-blue to-ritual-green" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => onOpenAgent(agent)} className="small-action">Open</button>
                    <button onClick={() => onOpenLogs(agent)} className="small-action"><ScrollText className="h-3.5 w-3.5" /> Logs</button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <GlassCard className="p-6">
      <div className="flex gap-3">
        <CircleAlert className="mt-1 h-5 w-5 shrink-0 text-ritual-gold" />
        <div>
          <h2 className="font-semibold text-slate-100">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{body}</p>
        </div>
      </div>
    </GlassCard>
  );
}
