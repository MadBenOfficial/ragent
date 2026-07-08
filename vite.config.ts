import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For GitHub Pages project site: build with GHPAGES=1 to emit "/ragent/" base.
const base = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.GHPAGES
  ? "/ragent/"
  : "/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          wallet: ["wagmi", "viem", "@tanstack/react-query"],
          motion: ["framer-motion"],
          crypto: ["eciesjs"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
