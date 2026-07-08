import { encodeFunctionData } from "viem";
import { useAccount, useSendTransaction } from "wagmi";
import { sovereignFactoryAbi } from "../lib/abis";
import { addLaunchRecord, createSovereignLaunchRecord } from "../lib/asyncJobs";
import { SOVEREIGN_LAUNCH_DEFAULTS } from "../lib/agentLaunch";
import { RITUAL_AGENT_FACTORIES } from "../lib/ritual";
import type { SovereignLaunchPlan } from "../types";

interface SovereignLaunchMetadata {
  agentName: string;
  agentId?: string;
}

export function useSovereignLaunch() {
  const { address } = useAccount();
  const { sendTransactionAsync, isPending } = useSendTransaction();

  async function launch(plan: SovereignLaunchPlan, metadata: SovereignLaunchMetadata) {
    if (plan.liveLaunchLocked) throw new Error(plan.lockReason);
    if (!plan.executor) throw new Error("No executor selected.");
    if (!plan.predictedChild) throw new Error("No predicted harness address.");

    const data = encodeFunctionData({
      abi: sovereignFactoryAbi,
      functionName: "launchSovereignCompressed",
      args: [
        plan.userSalt,
        plan.executor,
        SOVEREIGN_LAUNCH_DEFAULTS.dkmsTtl,
        plan.dkmsFunding,
        plan.params,
        plan.schedule,
        plan.schedulerLockDuration,
        plan.schedulerFunding,
        plan.windowNumCalls,
      ],
    });

    const txHash = await sendTransactionAsync({
      to: RITUAL_AGENT_FACTORIES.sovereign,
      data,
      value: plan.totalFunding,
      gas: 5_000_000n,
    });

    addLaunchRecord(
      createSovereignLaunchRecord({
        agentName: metadata.agentName,
        agentId: metadata.agentId,
        txHash,
        userSalt: plan.userSalt,
        harnessAddress: plan.predictedChild,
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
