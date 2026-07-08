import { formatEther, parseEther } from "viem";
import { useAccount, useBlockNumber, useReadContract, useWriteContract } from "wagmi";
import { ritualWalletAbi } from "../lib/abis";
import { RITUAL_SYSTEM_CONTRACTS } from "../lib/ritual";

export function useRitualWallet() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const { data: blockNumber } = useBlockNumber({ query: { refetchInterval: 15_000 } });

  const balance = useReadContract({
    address: RITUAL_SYSTEM_CONTRACTS.ritualWallet,
    abi: ritualWalletAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const lockUntil = useReadContract({
    address: RITUAL_SYSTEM_CONTRACTS.ritualWallet,
    abi: ritualWalletAbi,
    functionName: "lockUntil",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  async function deposit(amount: string, lockDuration: bigint) {
    const normalized = amount.trim();
    if (!normalized || Number(normalized) <= 0) {
      throw new Error("Enter a positive RITUAL amount before depositing.");
    }
    if (lockDuration <= 0n) {
      throw new Error("Enter a positive lock duration.");
    }
    return writeContractAsync({
      address: RITUAL_SYSTEM_CONTRACTS.ritualWallet,
      abi: ritualWalletAbi,
      functionName: "deposit",
      args: [lockDuration],
      value: parseEther(normalized),
    });
  }

  const balanceWei = balance.data ?? 0n;
  const lockUntilBlock = lockUntil.data ?? 0n;
  const currentBlock = blockNumber ?? 0n;
  const isLocked = currentBlock > 0n && lockUntilBlock > currentBlock;

  return {
    address,
    isConnected,
    balanceWei,
    balanceLabel: `${Number(formatEther(balanceWei)).toFixed(4)} RITUAL`,
    lockUntilBlock,
    currentBlock,
    isLocked,
    deposit,
    isDepositPending: isPending,
    isLoading: balance.isLoading || lockUntil.isLoading,
    refetch: () => {
      void balance.refetch();
      void lockUntil.refetch();
    },
  };
}
