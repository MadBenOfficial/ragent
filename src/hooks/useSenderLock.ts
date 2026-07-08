import { useAccount, useReadContract } from "wagmi";
import { asyncJobTrackerAbi } from "../lib/abis";
import { RITUAL_SYSTEM_CONTRACTS } from "../lib/ritual";

export function useSenderLock() {
  const { address } = useAccount();

  const query = useReadContract({
    address: RITUAL_SYSTEM_CONTRACTS.asyncJobTracker,
    abi: asyncJobTrackerAbi,
    functionName: "hasPendingJobForSender",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });

  return {
    ...query,
    isLocked: query.data ?? false,
  };
}
