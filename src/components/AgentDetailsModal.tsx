import type { RegisteredAgent } from "../types";
import { truncateHex } from "../lib/secrets";
import { RITUAL_CHAIN } from "../lib/ritual";
import { ModalShell } from "./ModalShell";
import { StatusBadge } from "./StatusBadge";

interface AgentDetailsModalProps {
  agent: RegisteredAgent | null;
  onClose: () => void;
  onEdit: (agent: RegisteredAgent) => void;
  onLaunch: (agent: RegisteredAgent) => void;
}

export function AgentDetailsModal({ agent, onClose, onEdit, onLaunch }: AgentDetailsModalProps) {
  return (
    <ModalShell open={!!agent} title={agent?.name ?? ""} subtitle="Agent operational details." onClose={onClose} wide>
      {agent ? (
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-blue-300/12 bg-slate-950/42 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-slate-300">{agent.id}</span>
              <StatusBadge value="Registered" />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-300">
              <Row label="Type" value={agent.agentType === "sovereign" ? "Sovereign Agent" : "Persistent Agent"} />
              <Row label="Owner" value={truncateHex(agent.owner, 10, 8)} />
              <Row label="Block" value={agent.blockNumber ?? "-"} />
              <Row label="Secrets" value={truncateHex(agent.secretsHash, 10, 8)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="tag">{agent.symbol}</span>
              <span className="tag">StorageRef</span>
              <span className="tag">Controller</span>
            </div>
          </div>
          <div className="rounded-lg border border-blue-300/12 bg-slate-950/42 p-4">
            <h3 className="text-sm font-semibold text-blue-100">Registration Trace</h3>
            {[
              "agent.registered",
              `tx.${agent.txHash ? truncateHex(agent.txHash, 10, 8) : "pending"}`,
              `salt.${truncateHex(agent.userSalt, 10, 8)}`,
              `hash.${truncateHex(agent.secretsHash, 10, 8)}`,
            ].map((item, index) => (
              <p key={item} className="mt-3 font-mono text-xs text-cyan-100">0{index + 1} / {item}</p>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-2 lg:col-span-2">
            {agent.txHash ? (
              <a
                href={`${RITUAL_CHAIN.explorerUrl}/tx/${agent.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="small-action"
              >
                Explorer
              </a>
            ) : null}
            <button onClick={() => onLaunch(agent)} className="small-action">Launch Flow</button>
            <button onClick={() => onEdit(agent)} className="small-action">Edit Agent</button>
            <button onClick={onClose} className="small-action">Close</button>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-100">{value}</span>
    </div>
  );
}
