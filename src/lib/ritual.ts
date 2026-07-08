import type { StoragePlatform } from "../types";

export const RITUAL_CHAIN = {
  id: 1979,
  name: "Ritual",
  nativeCurrency: {
    name: "RITUAL",
    symbol: "RITUAL",
    decimals: 18,
  },
  rpcUrl: "https://rpc.ritualfoundation.org",
  wsUrl: "wss://rpc.ritualfoundation.org/ws",
  explorerUrl: "https://explorer.ritualfoundation.org",
} as const;

export const RITUAL_SYSTEM_CONTRACTS = {
  ritualWallet: "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948",
  asyncJobTracker: "0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5",
  asyncDelivery: "0x5A16214fF555848411544b005f7Ac063742f39F6",
  teeServiceRegistry: "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F",
  scheduler: "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B",
  secretsAccessControl: "0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD",
} as const;

export const RITUAL_AGENT_FACTORIES = {
  sovereign: "0x9dC4C054e53bCc4Ce0A0Ff09E890A7a8e817f304",
  persistent: "0xD4AA9D55215dc8149Af57605e70921Ea16b73591",
} as const;

export const RITUAL_PRECOMPILES = {
  sovereignAgent: "0x000000000000000000000000000000000000080C",
  persistentAgent: "0x0000000000000000000000000000000000000820",
  http: "0x0000000000000000000000000000000000000801",
  llm: "0x0000000000000000000000000000000000000802",
} as const;

export const storagePlatformLabels: Record<StoragePlatform, string> = {
  hf: "HuggingFace",
  gcs: "Google Cloud Storage",
  pinata: "Pinata / IPFS",
  inline: "Inline",
};

export const DEFAULT_STORAGE_KEY_REFS: Record<Exclude<StoragePlatform, "inline">, string> = {
  hf: "HF_TOKEN",
  gcs: "GCS_CREDS",
  pinata: "PINATA_JWT",
};
