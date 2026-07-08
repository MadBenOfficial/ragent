import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card relative overflow-hidden rounded-lg border border-line bg-panel shadow-glass backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
