import { Cpu, RefreshCw } from "lucide-react";
import { useExecutors } from "../hooks/useExecutors";
import { truncateHex } from "../lib/secrets";

export function ExecutorStatusCard() {
  const { executors, selectedExecutor, hasExecutor, isLoading, refetch, error } = useExecutors();

  return (
    <div className="rounded-lg border border-blue-300/12 bg-slate-950/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className={hasExecutor ? "h-4 w-4 text-ritual-green" : "h-4 w-4 text-ritual-gold"} />
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">TEE Executor</h3>
        </div>
        <button
          onClick={() => void refetch()}
          className="grid h-7 w-7 place-items-center rounded-md border border-blue-300/14 text-slate-400 transition hover:text-cyan-100"
          aria-label="Refresh executors"
        >
          <RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        </button>
      </div>
      <div className="mt-3 grid gap-2 text-xs">
        <Row label="Capability" value="HTTP_CALL / Agents" />
        <Row label="Valid Executors" value={isLoading ? "Loading" : String(executors.filter((item) => item.isValid).length)} />
        <Row label="Selected" value={selectedExecutor ? truncateHex(selectedExecutor.teeAddress) : "None"} />
        <Row label="Public Key" value={selectedExecutor ? truncateHex(selectedExecutor.publicKey, 10, 8) : "Unavailable"} />
      </div>
      {error ? <p className="mt-2 text-xs text-ritual-gold">Registry read failed. Check wallet/RPC access.</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[160px] truncate text-right font-mono text-slate-300">{value}</span>
    </div>
  );
}
