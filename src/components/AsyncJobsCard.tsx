import { Activity, ExternalLink, RotateCcw } from "lucide-react";
import { useAsyncJobEvents } from "../hooks/useAsyncJobEvents";
import { RITUAL_CHAIN } from "../lib/ritual";
import { truncateHex } from "../lib/secrets";
import type { RitualAsyncStatus } from "../types";

export function AsyncJobsCard() {
  const { events, launchRecords, hasEvents, hasLaunchRecords, clearEvents } = useAsyncJobEvents();

  return (
    <div className="rounded-lg border border-blue-300/12 bg-slate-950/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-ritual-cyan" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">Async Jobs</h3>
        </div>
        <button
          onClick={clearEvents}
          disabled={!hasEvents && !hasLaunchRecords}
          className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-blue-300/10 hover:text-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Clear async job events"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        {hasLaunchRecords ? (
          launchRecords.slice(0, 4).map((record) => (
            <div key={record.id} className="rounded-md border border-blue-300/10 bg-black/20 p-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-semibold text-slate-200">{record.agentName}</span>
                <StatusPill status={record.status} />
              </div>
              <div className="mt-2 grid gap-1 font-mono text-[11px] text-slate-500">
                <span>tx {truncateHex(record.txHash, 10, 8)}</span>
                <span>child {truncateHex(record.harnessAddress, 8, 6)}</span>
                <span>job {record.jobId ? truncateHex(record.jobId, 10, 8) : "awaiting event"}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <a
                  href={`${RITUAL_CHAIN.explorerUrl}/tx/${record.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-blue-300/10 px-2 py-1 text-[11px] font-semibold text-blue-100 hover:border-blue-300/30"
                >
                  <ExternalLink className="h-3 w-3" />
                  Tx
                </a>
                {record.deliveryTxHash ? (
                  <a
                    href={`${RITUAL_CHAIN.explorerUrl}/tx/${record.deliveryTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-blue-300/10 px-2 py-1 text-[11px] font-semibold text-blue-100 hover:border-blue-300/30"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Delivery
                  </a>
                ) : null}
              </div>
            </div>
          ))
        ) : hasEvents ? (
          events.slice(0, 3).map((event) => (
            <div key={event.id} className="rounded-md border border-blue-300/10 bg-black/20 p-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-200">{event.type}</span>
                <span className="font-mono text-slate-500">#{event.blockNumber ?? "-"}</span>
              </div>
              <p className="mt-1 truncate font-mono text-[11px] text-slate-500">{truncateHex(event.jobId, 10, 8)}</p>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-blue-300/12 bg-black/15 p-3 text-xs text-slate-500">
            Launches and live Ritual async events will appear here.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: RitualAsyncStatus }) {
  const colors: Record<RitualAsyncStatus, string> = {
    SUBMITTING: "border-blue-300/20 text-blue-100",
    PENDING_COMMITMENT: "border-ritual-gold/30 text-ritual-gold",
    COMMITTED: "border-ritual-cyan/30 text-ritual-cyan",
    EXECUTOR_PROCESSING: "border-ritual-cyan/30 text-ritual-cyan",
    RESULT_READY: "border-ritual-green/30 text-ritual-green",
    PENDING_SETTLEMENT: "border-ritual-green/30 text-ritual-green",
    SETTLED: "border-ritual-green/30 text-ritual-green",
    FAILED: "border-red-300/30 text-red-200",
    EXPIRED: "border-slate-400/20 text-slate-400",
  };

  return (
    <span className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${colors[status]}`}>
      {status}
    </span>
  );
}
