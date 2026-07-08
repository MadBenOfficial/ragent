import { useMemo } from "react";
import type { Address, Hex } from "viem";
import { useReadContract } from "wagmi";
import { teeServiceRegistryAbi } from "../lib/abis";
import { RITUAL_SYSTEM_CONTRACTS } from "../lib/ritual";

export const EXECUTOR_CAPABILITY = {
  HTTP_CALL: 0,
  LLM: 1,
  IMAGE: 7,
  AUDIO: 8,
  VIDEO: 9,
} as const;

export interface RitualExecutor {
  paymentAddress: Address;
  teeAddress: Address;
  teeType: number;
  publicKey: Hex;
  endpoint: string;
  workloadId: Hex;
  capability: number;
  isValid: boolean;
}

export function useExecutors(capability = EXECUTOR_CAPABILITY.HTTP_CALL) {
  const query = useReadContract({
    address: RITUAL_SYSTEM_CONTRACTS.teeServiceRegistry,
    abi: teeServiceRegistryAbi,
    functionName: "getServicesByCapability",
    args: [capability, true],
    query: {
      refetchInterval: 30_000,
    },
  });

  const executors = useMemo<RitualExecutor[]>(() => {
    return (query.data ?? []).map((service) => ({
      paymentAddress: service.node.paymentAddress,
      teeAddress: service.node.teeAddress,
      teeType: service.node.teeType,
      publicKey: service.node.publicKey,
      endpoint: service.node.endpoint,
      workloadId: service.workloadId,
      capability: service.node.capability,
      isValid: service.isValid,
    }));
  }, [query.data]);

  const selectedExecutor = executors.find((executor) => executor.isValid) ?? null;

  return {
    ...query,
    capability,
    executors,
    selectedExecutor,
    hasExecutor: !!selectedExecutor,
  };
}
