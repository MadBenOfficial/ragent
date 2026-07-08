import { CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="fixed bottom-20 right-5 z-50 flex items-center gap-3 rounded-lg border border-ritual-green/25 bg-[#061514] px-4 py-3 text-sm text-ritual-green shadow-neon-green"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          role="alert"
        >
          <CheckCircle2 className="h-5 w-5" />
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
