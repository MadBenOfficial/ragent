import { ChevronDown, Loader2, Wallet } from "lucide-react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { RITUAL_CHAIN } from "../lib/ritual";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const wrongChain = isConnected && chainId !== RITUAL_CHAIN.id;
  const injectedConnector = connectors[0];

  if (!isConnected) {
    return (
      <button
        onClick={() => injectedConnector ? connect({ connector: injectedConnector }) : undefined}
        disabled={isPending || !injectedConnector}
        className="flex h-11 items-center gap-2 rounded-lg border border-blue-300/10 bg-slate-950/60 px-3 text-left transition hover:border-blue-300/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin text-ritual-gold" /> : <Wallet className="h-4 w-4 text-ritual-cyan" />}
        <span className="hidden leading-4 sm:block">
          <span className="block text-xs font-semibold text-slate-200">Connect wallet</span>
          <span className="block text-[10px] font-semibold text-ritual-cyan">Ritual Chain</span>
        </span>
      </button>
    );
  }

  if (wrongChain) {
    return (
      <button
        onClick={() => switchChain({ chainId: RITUAL_CHAIN.id })}
        disabled={isSwitching}
        className="flex h-11 items-center gap-2 rounded-lg border border-ritual-gold/30 bg-ritual-gold/10 px-3 text-left transition hover:border-ritual-gold/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSwitching ? <Loader2 className="h-4 w-4 animate-spin text-ritual-gold" /> : <Wallet className="h-4 w-4 text-ritual-gold" />}
        <span className="hidden leading-4 sm:block">
          <span className="block text-xs font-semibold text-ritual-gold">Switch network</span>
          <span className="block text-[10px] font-semibold text-slate-400">Chain {RITUAL_CHAIN.id}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => disconnect()}
      className="flex h-11 items-center gap-2 rounded-lg border border-blue-300/10 bg-slate-950/60 pl-2 pr-3 text-left transition hover:border-blue-300/30"
      title="Disconnect wallet"
    >
      <div className="grid h-8 w-8 place-items-center rounded-md border border-ritual-green/20 bg-ritual-green/10 text-xs font-semibold text-ritual-green">
        RA
      </div>
      <span className="hidden leading-4 sm:block">
        <span className="block font-mono text-xs text-slate-200">{address ? shortAddress(address) : "Connected"}</span>
        <span className="block text-[10px] font-semibold text-ritual-green">Builder</span>
      </span>
      <ChevronDown className="h-4 w-4 text-slate-500" />
    </button>
  );
}
