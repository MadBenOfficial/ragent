import { encodeFunctionData } from "viem";
import { useAccount, useSendTransaction } from "wagmi";
import { persistentFactoryAbi } from "../lib/abis";
import { addLaunchRecord, createSovereignLaunchRecord } from "../lib/asyncJobs";
import { PERSISTENT_LAUNCH_DEFAULTS } from "../lib/agentLaunch";
import { RITUAL_AGENT_FACTORIES } from "../lib/ritual";
import type { PersistentLaunchPlan } from "../types";

interface PersistentLaunchMetadata {
  agentName: string;
  agentId?: string;
}

export function usePersistentLaunch() {
  const { address } = useAccount();
  const { sendTransactionAsync, isPending } = useSendTransaction();

  async function launch(plan: PersistentLaunchPlan, metadata: PersistentLaunchMetadata) {
    if (plan.liveLaunchLocked) throw new Error(plan.lockReason);
    if (!plan.executor) throw new Error("No executor selected.");
    if (!plan.predictedLauncher) throw new Error("No predicted launcher address.");
    if (!plan.persistentInput || !plan.schedule) throw new Error("Persistent input is not ready.");

    const data = encodeFunctionData({
      abi: persistentFactoryAbi,
      functionName: "launchPersistentCompressed",
      args: [
        plan.userSalt,
        plan.executor,
        PERSISTENT_LAUNCH_DEFAULTS.dkmsTtl,
        plan.dkmsFunding,
        plan.persistentInput,
        plan.schedule,
        plan.schedulerLockDuration,
        plan.schedulerFunding,
      ],
    });

    const txHash = await sendTransactionAsync({
      to: RITUAL_AGENT_FACTORIES.persistent,
      data,
      value: plan.totalFunding,
      gas: 10_000_000n,
    });

    addLaunchRecord(
      createSovereignLaunchRecord({
        kind: "persistent",
        agentName: metadata.agentName,
        agentId: metadata.agentId,
        txHash,
        userSalt: plan.userSalt,
        harnessAddress: plan.predictedLauncher,
        executor: plan.executor,
        submittedBy: address,
      }),
    );

    return txHash;
  }

  return {
    launch,
    isPending,
  };
}
