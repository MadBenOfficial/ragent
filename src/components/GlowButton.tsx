import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export function GlowButton({ children, className, variant = "primary", ...props }: GlowButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
        variant === "primary"
          ? "border-blue-300/40 bg-gradient-to-r from-ritual-blue to-ritual-violet text-white shadow-neon-violet hover:-translate-y-0.5"
          : "border-ritual-cyan/30 bg-ritual-cyan/5 text-cyan-100 hover:border-ritual-cyan/60",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0",
        className,
      )}
      {...props}
    >
      <span className="absolute inset-y-0 left-0 w-1/2 -translate-x-full bg-white/20 blur-xl transition group-hover:translate-x-[220%]" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
