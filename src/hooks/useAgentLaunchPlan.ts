import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { persistentFactoryAbi, sovereignFactoryAbi } from "../lib/abis";
import { buildPersistentNotice, buildSovereignLaunchPlan } from "../lib/agentLaunch";
import { RITUAL_AGENT_FACTORIES } from "../lib/ritual";
import { useExecutors } from "./useExecutors";
import { useRitualWallet } from "./useRitualWallet";
import { useSenderLock } from "./useSenderLock";
import type { AgentLaunchPlan, AgentProfile, AgentTypeId, Capability, IntegrationConfig, SignedSecretBundle, StorageValidationResult } from "../types";

interface UseAgentLaunchPlanInput {
  profile: AgentProfile;
  agentType: AgentTypeId;
  capabilities: Capability[];
  userSalt: `0x${string}`;
  secretBundle: SignedSecretBundle | null;
  storageChecks: StorageValidationResult[];
  integrationConfigs: Record<string, IntegrationConfig>;
  dkmsFunding: bigint;
  schedulerFunding: bigint;
}

export function useAgentLaunchPlan(input: UseAgentLaunchPlanInput): AgentLaunchPlan {
  const { address, isConnected } = useAccount();
  const executors = useExecutors();
  const wallet = useRitualWallet();
  const senderLock = useSenderLock();

  const sovereignPrediction = useReadContract({
    address: RITUAL_AGENT_FACTORIES.sovereign,
    abi: sovereignFactoryAbi,
    functionName: "predictCompressedHarness",
    args: address ? [address, input.userSalt] : undefined,
    query: {
      enabled: input.agentType === "sovereign" && !!address,
    },
  });

  const persistentPrediction = useReadContract({
    address: RITUAL_AGENT_FACTORIES.persistent,
    abi: persistentFactoryAbi,
    functionName: "predictCompressedLauncher",
    args: address ? [address, input.userSalt] : undefined,
    query: {
      enabled: input.agentType === "persistent" && !!address,
    },
  });

  return useMemo(() => {
    const base = {
      profile: input.profile,
      capabilities: input.capabilities,
      userSalt: input.userSalt,
      isWalletConnected: isConnected,
      selectedExecutor: executors.selectedExecutor,
      predictedSovereign: sovereignPrediction.data,
      predictedPersistent: persistentPrediction.data,
      senderLocked: senderLock.isLocked,
      walletBalanceWei: wallet.balanceWei,
      secretBundle: input.secretBundle,
      storageChecks: input.storageChecks,
      integrationConfigs: input.integrationConfigs,
      dkmsFunding: input.dkmsFunding,
      schedulerFunding: input.schedulerFunding,
    };

    if (input.agentType === "persistent") {
      return buildPersistentNotice(base);
    }

    return buildSovereignLaunchPlan(base);
  }, [
    input.profile,
    input.capabilities,
    input.agentType,
    input.secretBundle,
    input.storageChecks,
    input.integrationConfigs,
    input.userSalt,
    input.dkmsFunding,
    input.schedulerFunding,
    isConnected,
    executors.selectedExecutor,
    sovereignPrediction.data,
    persistentPrediction.data,
    senderLock.isLocked,
    wallet.balanceWei,
  ]);
}
