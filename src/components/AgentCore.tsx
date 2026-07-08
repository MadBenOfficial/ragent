import { useMemo, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Fingerprint,
  GitFork,
  Goal,
  MoveRight,
  Network,
  ShieldCheck,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AgentProfile, AgentTypeId, Capability, StoragePlatform } from "../types";
import { cn } from "../lib/cn";
import { GlassCard } from "./GlassCard";
import { SectionHeader } from "./SectionHeader";

interface AgentCoreProps {
  agentType: AgentTypeId;
  profile: AgentProfile;
  capabilities: Capability[];
}

interface BlueprintModule {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  ready: boolean;
  icon: LucideIcon;
}

const storageLabels: Record<StoragePlatform, string> = {
  gcs: "Google Cloud Storage",
  hf: "HuggingFace",
  inline: "Inline",
  pinata: "Pinata",
};

export function AgentCore({ agentType, profile, capabilities }: AgentCoreProps) {
  const [selectedModuleId, setSelectedModuleId] = useState("memory");
  const [blueprintOpen, setBlueprintOpen] = useState(false);

  const enabledCapabilities = useMemo(
    () => capabilities.filter((capability) => capability.enabled),
    [capabilities],
  );

  const enabledCapabilityIds = useMemo(
    () => new Set(enabledCapabilities.map((capability) => capability.id)),
    [enabledCapabilities],
  );

  const modules = useMemo<BlueprintModule[]>(
    () => [
      {
        id: "memory",
        title: "Memory",
        subtitle: storageLabels[profile.storage.memory.platform],
        detail: profile.storage.memory.path || "No memory path configured.",
        ready: enabledCapabilityIds.has("memory") && Boolean(profile.storage.memory.path && profile.storage.memory.keyRef),
        icon: BrainCircuit,
      },
      {
        id: "knowledge",
        title: "Knowledge",
        subtitle: enabledCapabilityIds.has("http") ? "HTTP + storage refs" : "Storage refs only",
        detail: profile.storage.knowledge.path || "No knowledge path configured.",
        ready: Boolean(profile.storage.knowledge.path && profile.storage.knowledge.keyRef),
        icon: ClipboardList,
      },
      {
        id: "identity",
        title: "Identity",
        subtitle: agentType === "sovereign" ? "Sovereign registry" : "Persistent registry",
        detail: `${profile.name || "Unnamed agent"} / ${profile.symbol || "NO_SYMBOL"}`,
        ready: Boolean(profile.name.trim() && profile.symbol.trim()),
        icon: Fingerprint,
      },
      {
        id: "goals",
        title: "Goals",
        subtitle: profile.persona,
        detail: profile.description || "No mission description configured.",
        ready: Boolean(profile.description.trim()),
        icon: Goal,
      },
      {
        id: "reasoning",
        title: "Reasoning",
        subtitle: enabledCapabilityIds.has("llm") ? "LLM enabled" : "LLM disabled",
        detail: enabledCapabilityIds.has("llm")
          ? "Agent can use Ritual LLM reasoning."
          : "Enable LLM to let the agent reason before actions.",
        ready: enabledCapabilityIds.has("llm"),
        icon: Network,
      },
      {
        id: "execution",
        title: "Execution",
        subtitle: agentType === "sovereign" ? "Onchain capable" : "Stateful only",
        detail: enabledCapabilityIds.has("wallet")
          ? "Wallet capability is enabled for controlled onchain actions."
          : "Wallet execution is disabled.",
        ready: agentType === "persistent" || enabledCapabilityIds.has("wallet"),
        icon: Zap,
      },
    ],
    [agentType, enabledCapabilityIds, profile],
  );

  const selectedModule = modules.find((module) => module.id === selectedModuleId) ?? modules[0];
  const readyCount = modules.filter((module) => module.ready).length;
  const missingModules = modules.filter((module) => !module.ready);

  const blueprint = useMemo(
    () => ({
      app: "RAgent",
      type: agentType,
      profile: {
        name: profile.name,
        symbol: profile.symbol,
        persona: profile.persona,
        voice: profile.voice,
        description: profile.description,
      },
      storage: {
        memory: profile.storage.memory,
        knowledge: profile.storage.knowledge,
        output: profile.storage.output,
      },
      capabilities: enabledCapabilities.map((capability) => capability.title),
      readiness: {
        readyModules: readyCount,
        totalModules: modules.length,
        missing: missingModules.map((module) => module.title),
      },
    }),
    [agentType, enabledCapabilities, missingModules, modules.length, profile, readyCount],
  );

  return (
    <>
      <GlassCard className="relative overflow-hidden p-4 xl:col-start-2 xl:row-start-1 xl:self-start">
        <SectionHeader
          number="2"
          title="Agent Core"
          subtitle="Live blueprint built from this agent's real configuration."
          action={
            <button
              type="button"
              onClick={() => setBlueprintOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-ritual-green/35 bg-black/20 px-3 py-2 text-xs font-semibold text-ritual-green transition hover:border-ritual-green/70 hover:bg-ritual-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50 lg:flex"
            >
              <GitFork className="h-4 w-4" />
              View Blueprint
              <MoveRight className="h-4 w-4" />
            </button>
          }
        />

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-2 sm:grid-cols-2">
            {modules.map((module) => (
              <ModuleButton
                key={module.id}
                module={module}
                selected={module.id === selectedModule.id}
                onSelect={() => setSelectedModuleId(module.id)}
              />
            ))}
          </div>

          <div className="rounded-lg border border-line bg-black/24 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Selected Layer</p>
                <h3 className="mt-1 truncate text-base font-semibold text-slate-100">{selectedModule.title}</h3>
              </div>
              <StatusBadge ready={selectedModule.ready} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-300">{selectedModule.subtitle}</p>
            <p className="mt-2 break-words text-xs leading-5 text-slate-400">{selectedModule.detail}</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <SummaryTile label="Ready" value={`${readyCount}/${modules.length}`} />
              <SummaryTile label="Modules" value={String(enabledCapabilities.length)} />
            </div>

            <div className="mt-4 rounded-lg border border-ritual-green/20 bg-ritual-green/5 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-ritual-green">
                <ShieldCheck className="h-4 w-4" />
                Register readiness
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {missingModules.length === 0
                  ? "This blueprint has the required profile, storage and execution settings for registration."
                  : `Missing: ${missingModules.map((module) => module.title).join(", ")}.`}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {blueprintOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Agent blueprint"
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-line bg-panel shadow-glass">
            <div className="flex items-start justify-between gap-4 border-b border-line p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-ritual-green">Ritual blueprint</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">{profile.name || "Unnamed agent"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setBlueprintOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-slate-400 transition hover:border-slate-400 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50"
                aria-label="Close blueprint"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap break-words rounded-lg border border-line bg-black/40 p-4 font-mono text-xs leading-5 text-slate-300">
                {JSON.stringify(blueprint, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ModuleButton({
  module,
  selected,
  onSelect,
}: {
  module: BlueprintModule;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = module.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-[92px] items-start gap-3 rounded-lg border bg-black/18 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50",
        selected ? "border-ritual-green/70 shadow-neon-green" : "border-line hover:border-slate-500",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg border",
          module.ready ? "border-ritual-green/30 bg-ritual-green/10 text-ritual-green" : "border-amber-400/30 bg-amber-400/10 text-amber-300",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-slate-100">{module.title}</span>
          <StatusDot ready={module.ready} />
        </span>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-400">{module.subtitle}</span>
        <span className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{module.detail}</span>
      </span>
    </button>
  );
}

function StatusDot({ ready }: { ready: boolean }) {
  return (
    <span
      className={cn(
        "h-2 w-2 shrink-0 rounded-full",
        ready ? "bg-ritual-green shadow-neon-green" : "bg-amber-300",
      )}
    />
  );
}

function StatusBadge({ ready }: { ready: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold",
        ready
          ? "border-ritual-green/30 bg-ritual-green/10 text-ritual-green"
          : "border-amber-400/30 bg-amber-400/10 text-amber-300",
      )}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {ready ? "Ready" : "Needs input"}
    </span>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-black/24 p-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm text-slate-100">{value}</p>
    </div>
  );
}
