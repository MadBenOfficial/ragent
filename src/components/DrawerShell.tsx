import type { ReactNode } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface DrawerShellProps {
  open: boolean;
  title: string;
  subtitle?: string;
  side?: "left" | "right";
  onClose: () => void;
  children: ReactNode;
}

export function DrawerShell({ open, title, subtitle, side = "right", onClose, children }: DrawerShellProps) {
  const from = side === "right" ? 36 : -36;
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.aside
            className={`${side === "right" ? "ml-auto" : "mr-auto"} flex h-full w-full max-w-[560px] flex-col border-blue-300/18 bg-[#061022]/96 shadow-neon-violet ${side === "right" ? "border-l" : "border-r"}`}
            initial={{ x: from, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: from, opacity: 0 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-blue-300/10 p-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-50">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
              </div>
              <button
                onClick={onClose}
                aria-label={`Close ${title}`}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
