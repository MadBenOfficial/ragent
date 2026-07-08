import { useState } from "react";
import { Check, CheckCircle2, Copy, WifiOff } from "lucide-react";
import { useAccount, useBlockNumber } from "wagmi";
import { appMeta } from "../data/seedData";
import { useRAgentController } from "../hooks/useRAgentController";
import type { AgentProfile, AgentTypeId, SignedSecretBundle } from "../types";

interface BottomStatusBarProps {
  profile: AgentProfile;
  agentType: AgentTypeId;
  secretBundle: SignedSecretBundle | null;
}

function shortHex(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function BottomStatusBar({ profile, agentType, secretBundle }: BottomStatusBarProps) {
  const { address, isConnected } = useAccount();
  const { data: blockNumber } = useBlockNumber({ query: { refetchInterval: 15_000 } });
  const { prepared } = useRAgentController({ profile, agentType, secretsHash: secretBundle?.secretsHash });
  const [copied, setCopied] = useState(false);

  const agentId = prepared.agentId;
  const agentIdLabel = agentId ? shortHex(agentId) : "—";
  const readyToRegister = profile.name.trim().length > 0 && profile.symbol.trim().length > 0;

  async function copyAgentId() {
    if (!agentId) return;
    try {
      await navigator.clipboard.writeText(agentId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <footer className="fixed bottom-0 left-16 right-0 z-30 hidden h-16 items-center gap-4 border-t border-blue-300/10 bg-black/52 px-4 backdrop-blur-xl lg:flex">
      <div className="flex h-10 items-center gap-2 rounded-lg border border-blue-300/10 bg-slate-950/45 px-3">
        <span className="text-xs text-slate-500">Agent ID:</span>
        <span className="font-mono text-xs text-slate-300">{agentIdLabel}</span>
        <button
          onClick={copyAgentId}
          disabled={!agentId}
          className="grid h-5 w-5 place-items-center rounded text-slate-500 transition hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Copy agent ID"
          title={agentId ? "Copy agent ID" : "Agent ID available once connected"}
        >
          {copied ? <Check className="h-4 w-4 text-ritual-green" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex h-10 items-center gap-3 px-2">
        <span className="text-xs text-slate-500">Version: {appMeta.version}</span>
        <span className="rounded-md border border-ritual-cyan/20 bg-ritual-cyan/12 px-3 py-1 text-xs font-semibold text-cyan-100">
          {readyToRegister ? "Ready" : "Draft"}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
        {isConnected ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-ritual-green" />
            {address ? shortHex(address) : "Connected"}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-slate-500" />
            Not connected
          </>
        )}
      </div>
      <div className="h-10 rounded-lg border border-blue-300/10 bg-slate-950/40 px-4 py-2 text-xs text-slate-400">
        Block: <span className="font-mono text-cyan-100">{blockNumber ? blockNumber.toString() : "—"}</span>
      </div>
    </footer>
  );
}
