import { useMemo, useState, type ReactNode } from "react";
import { Copy, Download, Power, RotateCcw, Search, Trash2 } from "lucide-react";
import { createOptions, moduleLibrary, voiceOptions } from "../data/seedData";
import { useAsyncJobEvents } from "../hooks/useAsyncJobEvents";
import { useRitualWallet } from "../hooks/useRitualWallet";
import { RITUAL_CHAIN } from "../lib/ritual";
import type { Capability, ModuleItem, RailToolId } from "../types";
import type { WorkspaceSettings } from "../lib/settingsStore";
import { DrawerShell } from "./DrawerShell";
import { ModalShell } from "./ModalShell";
import { MetricCard } from "./MetricCard";
import { MiniChart } from "./MiniChart";
import { StatusBadge } from "./StatusBadge";

const MODULE_CAPABILITY_ALIAS: Record<string, string> = { zk: "zkfhe" };

function moduleCapabilityId(moduleId: string) {
  return MODULE_CAPABILITY_ALIAS[moduleId] ?? moduleId;
}

interface ToolPanelsProps {
  activeTool: RailToolId | null;
  onClose: () => void;
  onNewAgent: () => void;
  onNotify: (message: string) => void;
  capabilities: Capability[];
  onToggleModule: (module: ModuleItem) => void;
  settings: WorkspaceSettings;
  onUpdateSetting: <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => void;
  onResetSettings: () => void;
}

export function ToolPanels({
  activeTool,
  onClose,
  onNewAgent,
  onNotify,
  capabilities,
  onToggleModule,
  settings,
  onUpdateSetting,
  onResetSettings,
}: ToolPanelsProps) {
  const [moduleFilter, setModuleFilter] = useState("All");
  const [moduleQuery, setModuleQuery] = useState("");
  const asyncJobs = useAsyncJobEvents(activeTool === "analytics" || activeTool === "terminal" || activeTool === "lab");
  const wallet = useRitualWallet();

  const enabledCapabilityIds = useMemo(
    () => new Set(capabilities.filter((capability) => capability.enabled).map((capability) => capability.id)),
    [capabilities],
  );

  function chooseCreate(id: string) {
    if (id !== "agent") return;
    onNewAgent();
    onClose();
  }

  const modules = useMemo(() => {
    return moduleLibrary.filter((item) => {
      const matchesFilter = moduleFilter === "All" || item.category === moduleFilter;
      const matchesQuery = item.name.toLowerCase().includes(moduleQuery.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [moduleFilter, moduleQuery]);

  const analyticsMetrics = useMemo(() => {
    const active = asyncJobs.launchRecords.filter((record) => !["SETTLED", "FAILED", "EXPIRED"].includes(record.status)).length;
    const settled = asyncJobs.launchRecords.filter((record) => record.status === "SETTLED").length;
    const failed = asyncJobs.launchRecords.filter((record) => record.status === "FAILED" || record.status === "EXPIRED").length;
    return [
      { label: "Tracked Launches", value: String(asyncJobs.launchRecords.length) },
      { label: "Active Jobs", value: String(active) },
      { label: "Settled Jobs", value: String(settled) },
      { label: "Failed / Expired", value: String(failed) },
    ];
  }, [asyncJobs.launchRecords]);

  const terminalLines = useMemo(() => {
    const limit = settings.compactActivityLog ? 5 : 12;
    const launchLines = asyncJobs.launchRecords.slice(0, limit).map((record) => {
      const job = record.jobId ? ` job=${record.jobId}` : "";
      return `[launch] ${record.agentName} status=${record.status} tx=${record.txHash}${job}`;
    });
    const eventLines = asyncJobs.events.slice(0, limit).map((event) => `[event] ${event.type} job=${event.jobId} block=${event.blockNumber ?? "-"}`);
    return [...launchLines, ...eventLines];
  }, [asyncJobs.events, asyncJobs.launchRecords, settings.compactActivityLog]);

  async function copyActivity() {
    try {
      await navigator.clipboard.writeText(terminalLines.join("\n"));
      onNotify("Activity copied.");
    } catch {
      onNotify("Clipboard permission was blocked by the browser.");
    }
  }

  function exportActivity() {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        chainId: RITUAL_CHAIN.id,
        launches: asyncJobs.launchRecords,
        events: asyncJobs.events,
      },
      null,
      2,
    );
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ragent-activity.json";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    onNotify("Activity exported.");
  }

  return (
    <>
      <ModalShell
        open={activeTool === "create"}
        title="Create New"
        subtitle="Start a new agent profile in Foundry."
        onClose={onClose}
      >
        <div className="grid gap-3">
          {createOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button key={option.id} onClick={() => chooseCreate(option.id)} className="rounded-lg border border-blue-300/14 bg-slate-950/42 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300/35">
                <Icon className="h-6 w-6 text-cyan-100" />
                <h3 className="mt-3 font-semibold text-slate-100">{option.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-400">{option.description}</p>
              </button>
            );
          })}
        </div>
      </ModalShell>

      <DrawerShell open={activeTool === "lab"} side="left" title="Ritual Network" subtitle="Live chain and local launch tracking status." onClose={onClose}>
        <div className="grid gap-3">
          {[
            ["Network", RITUAL_CHAIN.name],
            ["Chain ID", String(RITUAL_CHAIN.id)],
            ["Current Block", wallet.currentBlock > 0n ? wallet.currentBlock.toString() : "loading"],
            ["Wallet Deposit", wallet.isConnected ? wallet.balanceLabel : "wallet not connected"],
            ["Launch Records", String(asyncJobs.launchRecords.length)],
            ["Async Events", String(asyncJobs.events.length)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-blue-300/12 bg-slate-950/42 p-3 text-sm">
              <span className="text-slate-400">{label}</span>
              <span className="font-mono text-slate-100">{value}</span>
            </div>
          ))}
          <div className="rounded-lg border border-blue-300/12 bg-slate-950/42 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Recent Activity</h3>
            {(terminalLines.length ? terminalLines.slice(0, 5) : ["No Ritual launches or async events tracked in this browser yet."]).map((item) => (
              <p key={item} className="mt-2 font-mono text-xs text-cyan-100">{item}</p>
            ))}
          </div>
          <button onClick={wallet.refetch} className="small-action justify-center">Refresh Wallet State</button>
        </div>
      </DrawerShell>

      <DrawerShell open={activeTool === "modules"} title="Modules Library" subtitle="Reference list of Ritual capabilities supported by the builder." onClose={onClose}>
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-300/12 bg-slate-950/42 px-3 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input value={moduleQuery} onChange={(event) => setModuleQuery(event.target.value)} placeholder="Search modules..." className="w-full bg-transparent text-sm text-slate-200 outline-none" />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {["All", "Core", "Data", "Execution", "Safety", "Experimental"].map((item) => (
            <button key={item} onClick={() => setModuleFilter(item)} className={moduleFilter === item ? "chip-active" : "chip"}>{item}</button>
          ))}
        </div>
        <div className="grid gap-3">
          {modules.map((item) => (
            <ModuleRow
              key={item.id}
              item={item}
              enabled={enabledCapabilityIds.has(moduleCapabilityId(item.id))}
              onToggle={() => onToggleModule(item)}
            />
          ))}
        </div>
      </DrawerShell>

      <DrawerShell open={activeTool === "analytics"} title="Agent Analytics" subtitle="Track launch health, callback activity, and local history." onClose={onClose}>
        <div className="grid gap-3 sm:grid-cols-2">
          {analyticsMetrics.map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.value} />)}
        </div>
        <div className="mt-4 grid gap-3">
          <MiniChart title="Launch Activity" values={chartValues(asyncJobs.launchRecords.length)} />
          <MiniChart title="Async Events" values={chartValues(asyncJobs.events.length)} />
          <MiniChart title="Settled Ratio" values={chartValues(Number(analyticsMetrics[2].value))} />
          <MiniChart title="Failure Pressure" values={chartValues(Number(analyticsMetrics[3].value))} />
        </div>
      </DrawerShell>

      <DrawerShell open={activeTool === "terminal"} title="Activity Log" subtitle="Inspect tracked launches and Ritual async callback events." onClose={onClose}>
        <div className="mb-3 flex flex-wrap gap-2">
          <button onClick={asyncJobs.clearEvents} className="small-action"><Trash2 className="h-3.5 w-3.5" /> Clear</button>
          <button onClick={copyActivity} disabled={!terminalLines.length} className="small-action disabled:cursor-not-allowed disabled:opacity-50"><Copy className="h-3.5 w-3.5" /> Copy</button>
          <button onClick={exportActivity} className="small-action"><Download className="h-3.5 w-3.5" /> Export JSON</button>
        </div>
        <div className="h-[460px] overflow-auto rounded-lg border border-blue-300/12 bg-black/55 p-4 font-mono text-xs leading-6 text-cyan-100">
          {terminalLines.length ? terminalLines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>) : <p>No tracked Ritual activity yet.</p>}
        </div>
      </DrawerShell>

      <DrawerShell open={activeTool === "settings"} title="Workspace Settings" subtitle="Preferences applied to new agents and launch safety." onClose={onClose}>
        <div className="grid gap-4">
          <SettingsGroup title="Builder Defaults">
            <SelectRow
              label="Default Agent Type"
              value={settings.defaultAgentType}
              options={[
                { value: "sovereign", label: "Sovereign Agent" },
                { value: "persistent", label: "Persistent Agent" },
              ]}
              onChange={(value) => {
                onUpdateSetting("defaultAgentType", value as WorkspaceSettings["defaultAgentType"]);
                onNotify("Default agent type saved.");
              }}
            />
            <SelectRow
              label="Default Voice"
              value={settings.defaultVoice}
              options={voiceOptions.map((voice) => ({ value: voice, label: voice }))}
              onChange={(value) => {
                onUpdateSetting("defaultVoice", value);
                onNotify("Default voice saved.");
              }}
            />
          </SettingsGroup>

          <SettingsGroup title="Safety & Display">
            <ToggleRow
              label="Confirm before live launch"
              detail="Require the launch confirmation checkbox in the deploy modal."
              checked={settings.confirmBeforeLaunch}
              onChange={(value) => {
                onUpdateSetting("confirmBeforeLaunch", value);
                onNotify(value ? "Launch confirmation enabled." : "Launch confirmation relaxed.");
              }}
            />
            <ToggleRow
              label="Compact activity log"
              detail="Show fewer lines in the Activity and Network panels."
              checked={settings.compactActivityLog}
              onChange={(value) => {
                onUpdateSetting("compactActivityLog", value);
                onNotify("Activity log density updated.");
              }}
            />
          </SettingsGroup>

          <SettingsSection title="Network (read-only)" items={[`Active Network: ${RITUAL_CHAIN.name}`, "RPC Endpoint: configured", `Chain ID: ${RITUAL_CHAIN.id}`, "Explorer: Ritual"]} />

          <button
            onClick={() => {
              onResetSettings();
              onNotify("Settings reset to defaults.");
            }}
            className="small-action justify-center"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
          </button>
        </div>
      </DrawerShell>
    </>
  );
}

function ModuleRow({ item, enabled, onToggle }: { item: ModuleItem; enabled: boolean; onToggle: () => void }) {
  const Icon = item.icon;
  return (
    <div className={`rounded-lg border p-3 transition ${enabled ? "border-ritual-green/35 bg-emerald-500/5" : "border-blue-300/12 bg-slate-950/42"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${enabled ? "border-ritual-green/30 bg-emerald-500/10 text-emerald-200" : "border-blue-300/16 bg-blue-500/10 text-blue-100"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-100">{item.name}</h3>
            <StatusBadge value={enabled ? "Enabled" : item.status === "Enabled" ? "Available" : item.status} />
          </div>
          <p className="mt-1 text-sm text-slate-400">{item.description}</p>
          <button
            onClick={onToggle}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
              enabled
                ? "border-ritual-green/40 text-emerald-200 hover:border-ritual-green/70"
                : "border-blue-300/20 text-blue-100 hover:border-blue-300/45"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {enabled ? "Enabled for agent" : "Enable for agent"}
          </button>
        </div>
      </div>
    </div>
  );
}

function chartValues(count: number) {
  if (count <= 0) return [4, 4, 4, 4, 4, 4, 4];
  return [1, 2, 3, 5, 8, 13, Math.max(13, count * 12)].map((value) => Math.min(100, value + count * 4));
}

function SettingsSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-blue-300/12 bg-slate-950/42 p-4">
      <h3 className="text-sm font-semibold text-blue-100">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item} className="rounded-md bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-300/12 bg-slate-950/42 p-4">
      <h3 className="text-sm font-semibold text-blue-100">{title}</h3>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-blue-300/16 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-blue-300/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-200">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-5 w-9 shrink-0 rounded-full border transition ${
          checked ? "border-ritual-green/50 bg-emerald-500/30" : "border-blue-300/20 bg-slate-800/60"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-slate-100 transition-all ${checked ? "left-4" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}
