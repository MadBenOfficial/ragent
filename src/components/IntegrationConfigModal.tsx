import { useEffect, useState } from "react";
import type { IntegrationConfig, IntegrationItem } from "../types";
import { ModalShell } from "./ModalShell";
import { StatusBadge } from "./StatusBadge";

interface IntegrationConfigModalProps {
  integration: IntegrationItem | null;
  config?: IntegrationConfig;
  onClose: () => void;
  onSave: (config: Omit<IntegrationConfig, "updatedAt">) => void;
}

export function IntegrationConfigModal({ integration, config, onClose, onSave }: IntegrationConfigModalProps) {
  const [endpoint, setEndpoint] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [allowPreflight, setAllowPreflight] = useState(true);

  useEffect(() => {
    if (!integration) return;
    setEndpoint(config?.endpoint ?? defaultIntegrationInput(integration.id));
    setEnabled(config?.enabled ?? integration.status !== "Disabled");
    setAllowPreflight(config?.allowPreflight ?? true);
  }, [config, integration]);

  return (
    <ModalShell open={!!integration} title="Configure Integration" subtitle={integration?.name} onClose={onClose}>
      {integration ? (
        <div className="grid gap-4">
          <div className="flex items-center justify-between rounded-lg border border-blue-300/12 bg-slate-950/42 p-4">
            <span className="font-semibold text-slate-100">{integration.name}</span>
            <StatusBadge value={integration.status} />
          </div>
          <label className="grid gap-1.5">
            <span className="text-xs text-slate-400">Endpoint / input</span>
            <input className="input" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-blue-300/12 bg-slate-950/42 p-3 text-sm text-slate-300">
            Enable for new agents
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="h-4 w-4 accent-blue-500" />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-blue-300/12 bg-slate-950/42 p-3 text-sm text-slate-300">
            Allow launch preflight
            <input type="checkbox" checked={allowPreflight} onChange={(event) => setAllowPreflight(event.target.checked)} className="h-4 w-4 accent-blue-500" />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="small-action">Cancel</button>
            <button
              onClick={() => onSave({ id: integration.id, endpoint: endpoint.trim(), enabled, allowPreflight })}
              className="small-action"
            >
              Save
            </button>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}

function defaultIntegrationInput(id: string) {
  if (id.includes("http") || id.includes("webhook")) return "https://api.example.com/agent-signal";
  if (id.includes("memory")) return "hf://owner/dataset/path";
  if (id.includes("callback")) return "0x0000000000000000000000000000000000000000";
  if (id.includes("ritual")) return "https://rpc.ritualfoundation.org";
  return "";
}
