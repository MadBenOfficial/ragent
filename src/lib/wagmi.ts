import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";
import { RITUAL_CHAIN } from "./ritual";

export const ritualChain = defineChain({
  id: RITUAL_CHAIN.id,
  name: RITUAL_CHAIN.name,
  nativeCurrency: RITUAL_CHAIN.nativeCurrency,
  rpcUrls: {
    default: {
      http: [RITUAL_CHAIN.rpcUrl],
      webSocket: [RITUAL_CHAIN.wsUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "Ritual Explorer",
      url: RITUAL_CHAIN.explorerUrl,
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [ritualChain],
  connectors: [injected()],
  transports: {
    [ritualChain.id]: http(RITUAL_CHAIN.rpcUrl),
  },
});
