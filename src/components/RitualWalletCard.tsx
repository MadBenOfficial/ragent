import { useState } from "react";
import { Loader2, WalletCards } from "lucide-react";
import { useRitualWallet } from "../hooks/useRitualWallet";
import { useSenderLock } from "../hooks/useSenderLock";

export function RitualWalletCard() {
  const wallet = useRitualWallet();
  const senderLock = useSenderLock();
  const [amount, setAmount] = useState("");
  const [lockBlocks, setLockBlocks] = useState("100000");
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deposit() {
    setError(null);
    setLastTx(null);

    try {
      const hash = await wallet.deposit(amount, BigInt(lockBlocks || "0"));
      setLastTx(hash);
      wallet.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed.");
    }
  }

  return (
    <div className="rounded-lg border border-blue-300/12 bg-slate-950/40 p-3">
      <div className="flex items-center gap-2">
        <WalletCards className="h-4 w-4 text-ritual-green" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">RitualWallet</h3>
      </div>
      <div className="mt-3 grid gap-2 text-xs">
        <Row label="Balance" value={wallet.isConnected ? wallet.balanceLabel : "Connect wallet"} />
        <Row label="Lock Until" value={wallet.lockUntilBlock > 0n ? wallet.lockUntilBlock.toString() : "None"} />
        <Row label="Current Block" value={wallet.currentBlock > 0n ? wallet.currentBlock.toString() : "-"} />
        <Row label="Sender Lock" value={senderLock.isLocked ? "Pending async job" : "Clear"} />
      </div>
      <div className="mt-3 grid grid-cols-[1fr_1fr] gap-2">
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="input font-mono text-xs"
          placeholder="RITUAL"
          inputMode="decimal"
        />
        <input
          value={lockBlocks}
          onChange={(event) => setLockBlocks(event.target.value)}
          className="input font-mono text-xs"
          placeholder="Lock blocks"
          inputMode="numeric"
        />
      </div>
      <button
        onClick={() => void deposit()}
        disabled={!wallet.isConnected || wallet.isDepositPending}
        className="small-action mt-3 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        {wallet.isDepositPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Deposit for Fees
      </button>
      {lastTx ? <p className="mt-2 truncate font-mono text-xs text-ritual-green">tx {lastTx}</p> : null}
      {error ? <p className="mt-2 line-clamp-2 text-xs text-ritual-gold">{error}</p> : null}
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
