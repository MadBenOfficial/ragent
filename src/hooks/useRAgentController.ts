import { useMemo } from "react";
import { isAddress, isAddressEqual, zeroAddress, type Address, type Hex } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { ragentControllerAbi } from "../lib/abis";
import { agentTypeToCode, makeUserSalt, normalizeSecretsHash, toControllerStorageRef } from "../lib/storage";
import type { AgentProfile, AgentTypeId, PreparedAgentRegistration } from "../types";

const configuredController = import.meta.env.VITE_RAGENT_CONTROLLER;
export const RAGENT_CONTROLLER_ADDRESS =
  configuredController && isAddress(configuredController) && !isAddressEqual(configuredController, zeroAddress) ? configuredController : undefined;
export const RAGENT_CONTROLLER_DEPLOY_BLOCK = 43_257_100n;

interface RegistrationInput {
  profile: AgentProfile;
  agentType: AgentTypeId;
  secretsHash?: Hex;
}

export function prepareAgentRegistration(
  profile: AgentProfile,
  agentType: AgentTypeId,
  owner: Address | undefined,
  secretsHash?: Hex,
): PreparedAgentRegistration {
  return {
    controllerAddress: RAGENT_CONTROLLER_ADDRESS,
    agentTypeCode: agentTypeToCode(agentType),
    userSalt: makeUserSalt(owner, profile),
    memoryRef: toControllerStorageRef(profile.storage.memory),
    outputRef: toControllerStorageRef(profile.storage.output),
    secretsHash: normalizeSecretsHash(secretsHash),
  };
}

export function useRAgentController(input: RegistrationInput) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const prepared = useMemo(
    () => prepareAgentRegistration(input.profile, input.agentType, address, input.secretsHash),
    [address, input.agentType, input.profile, input.secretsHash],
  );

  const computedAgentId = useReadContract({
    address: RAGENT_CONTROLLER_ADDRESS,
    abi: ragentControllerAbi,
    functionName: "computeAgentId",
    args: address ? [address, prepared.userSalt, input.profile.name, input.profile.symbol] : undefined,
    query: { enabled: !!RAGENT_CONTROLLER_ADDRESS && !!address },
  });

  const predictedChild = useReadContract({
    address: RAGENT_CONTROLLER_ADDRESS,
    abi: ragentControllerAbi,
    functionName: "predictAgentChild",
    args: address ? [prepared.agentTypeCode, address, prepared.userSalt] : undefined,
    query: { enabled: !!RAGENT_CONTROLLER_ADDRESS && !!address },
  });

  async function registerAgent() {
    if (!RAGENT_CONTROLLER_ADDRESS) throw new Error("Set VITE_RAGENT_CONTROLLER before registering an agent.");
    return writeContractAsync({
      address: RAGENT_CONTROLLER_ADDRESS,
      abi: ragentControllerAbi,
      functionName: "registerAgent",
      args: [
        prepared.userSalt,
        prepared.agentTypeCode,
        input.profile.name,
        input.profile.symbol,
        prepared.memoryRef,
        prepared.outputRef,
        prepared.secretsHash,
      ],
    });
  }

  return {
    address,
    isConnected,
    controllerAddress: RAGENT_CONTROLLER_ADDRESS,
    isControllerConfigured: !!RAGENT_CONTROLLER_ADDRESS,
    prepared: {
      ...prepared,
      agentId: computedAgentId.data,
    },
    predictedChild: predictedChild.data?.[0],
    dkmsContext: predictedChild.data?.[1],
    isPending,
    registerAgent,
    refetch: () => {
      void computedAgentId.refetch();
      void predictedChild.refetch();
    },
  };
}
