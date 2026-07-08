import { Bell, Link2, MessageSquareText, TerminalSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useAccount, useChainId } from "wagmi";
import { appMeta, navItems } from "../data/seedData";
import { RITUAL_CHAIN } from "../lib/ritual";
import { cn } from "../lib/cn";
import type { TopNavId } from "../types";
import { WalletButton } from "./WalletButton";

export type TopBarAction = "explorer" | "activity" | "docs" | "analytics";

interface TopBarProps {
  activeNav: TopNavId;
  onNavChange: (nav: TopNavId) => void;
  onUtilityAction: (action: TopBarAction) => void;
}

export function TopBar({ activeNav, onNavChange, onUtilityAction }: TopBarProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const onRitual = isConnected && chainId === RITUAL_CHAIN.id;
  const wrongChain = isConnected && chainId !== RITUAL_CHAIN.id;
  const statusDot = onRitual
    ? "bg-ritual-green shadow-neon-green"
    : wrongChain
      ? "bg-ritual-gold"
      : "bg-slate-500";
  const statusTitle = onRitual ? "Connected to Ritual" : wrongChain ? "Wrong network" : "Wallet not connected";

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 min-w-0 items-center gap-2 border-b border-blue-300/10 bg-black/42 px-2 backdrop-blur-xl sm:px-4">
      <div className="flex w-[126px] shrink-0 items-center gap-2 sm:w-[220px] sm:gap-3 xl:w-[280px] 2xl:w-[360px]">
        <div className="relative grid h-10 w-10 place-items-center rounded-lg border border-ritual-cyan/40 bg-ritual-blue/10 shadow-neon-blue">
          <div className="absolute inset-1 rounded-md border border-ritual-violet/40" />
          <span className="font-display text-lg font-black text-cyan-100">RA</span>
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-normal text-slate-50 sm:text-xl">{appMeta.name}</h1>
          <p className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:block">Ritual agent console</p>
        </div>
      </div>

      <nav className="scrollbar-none flex min-w-0 flex-1 items-center justify-start gap-5 overflow-x-auto px-1 sm:px-3 lg:justify-center lg:gap-8">
        {navItems.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className="relative px-1 py-5 text-sm font-medium text-slate-400 transition hover:text-slate-100"
            >
              <span className={active ? "text-blue-200" : undefined}>{item.label}</span>
              {active ? (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-ritual-blue via-ritual-violet to-ritual-cyan shadow-neon-violet"
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2 lg:gap-3">
        <div
          className="hidden h-10 items-center gap-2 rounded-lg border border-blue-300/15 bg-slate-950/70 px-3 text-xs text-slate-300 shadow-glass md:flex"
          title={statusTitle}
        >
          <span className={cn("h-2 w-2 rounded-full", statusDot)} />
          {RITUAL_CHAIN.name} - {RITUAL_CHAIN.id}
        </div>
        {[
          { icon: Link2, label: "Open Ritual explorer", action: "explorer" as const },
          { icon: TerminalSquare, label: "Open activity log", action: "activity" as const },
          { icon: MessageSquareText, label: "Open docs", action: "docs" as const },
          { icon: Bell, label: "Open analytics", action: "analytics" as const },
        ].map(({ icon: Icon, label, action }, index) => (
          <button
            key={index}
            onClick={() => onUtilityAction(action)}
            className="hidden h-10 w-10 place-items-center rounded-lg border border-blue-300/10 bg-slate-950/50 text-slate-400 transition hover:border-blue-300/30 hover:text-cyan-100 2xl:grid"
            aria-label={label}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <WalletButton />
      </div>
    </header>
  );
}
