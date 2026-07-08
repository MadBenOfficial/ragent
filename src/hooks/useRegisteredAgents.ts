import { useCallback, useEffect, useState } from "react";
import type { Address, Hex } from "viem";
import { useAccount, usePublicClient, useWatchContractEvent } from "wagmi";
import { ragentControllerAbi } from "../lib/abis";
import { RAGENT_CONTROLLER_ADDRESS, RAGENT_CONTROLLER_DEPLOY_BLOCK } from "./useRAgentController";
import type { AgentTypeId, RegisteredAgent } from "../types";

const EVENT_CHUNK_SIZE = 50_000n;
const INDEX_PAGE_SIZE = 50n;

interface ControllerAgentConfig {
  owner: Address;
  userSalt: Hex;
  agentType: bigint | number;
  name: string;
  symbol: string;
  memoryRef: {
    platform: string;
    path: string;
    keyRef: string;
  };
  outputRef: {
    platform: string;
    path: string;
    keyRef: string;
  };
  secretsHash: Hex;
  active: boolean;
}

function agentTypeFromCode(code: number): AgentTypeId {
  return code === 0 ? "sovereign" : "persistent";
}

function upsertAgents(current: RegisteredAgent[], next: RegisteredAgent[]) {
  const byId = new Map(current.map((agent) => [agent.id, agent]));
  for (const agent of next) byId.set(agent.id, agent);
  return Array.from(byId.values()).sort((a, b) => Number(BigInt(b.blockNumber ?? 0) - BigInt(a.blockNumber ?? 0)));
}

interface AgentRegisteredLog {
  args: {
    agentId?: Hex;
    owner?: `0x${string}`;
    agentType?: bigint | number;
    userSalt?: Hex;
    secretsHash?: Hex;
    name?: string;
    symbol?: string;
  };
  transactionHash?: Hex;
  blockNumber?: bigint;
}

export function useRegisteredAgents() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [agents, setAgents] = useState<RegisteredAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendLogs = useCallback((logs: readonly AgentRegisteredLog[]) => {
    const next = logs
      .filter((log) => !address || log.args.owner?.toLowerCase() === address.toLowerCase())
      .map((log) => ({
        id: log.args.agentId ?? "0x",
        owner: log.args.owner ?? "0x0000000000000000000000000000000000000000",
        agentType: agentTypeFromCode(Number(log.args.agentType ?? 0)),
        userSalt: log.args.userSalt ?? "0x",
        secretsHash: log.args.secretsHash ?? "0x",
        name: log.args.name ?? "Unnamed Agent",
        symbol: log.args.symbol ?? "AGENT",
        source: "events" as const,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber?.toString(),
      }));

    setAgents((current) => upsertAgents(current, next));
  }, [address]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistoricalAgents() {
      if (!RAGENT_CONTROLLER_ADDRESS || !publicClient) {
        setAgents([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      setAgents([]);

      try {
        if (address) {
          const indexedAgents = await getIndexedAgents(publicClient, RAGENT_CONTROLLER_ADDRESS, address);
          if (!cancelled) {
            setAgents(indexedAgents);
            return;
          }
        }

        const logs = await getAgentRegisteredLogs(publicClient, RAGENT_CONTROLLER_ADDRESS, RAGENT_CONTROLLER_DEPLOY_BLOCK);
        if (!cancelled) {
          appendLogs(logs);
          if (address) {
            setError("This controller does not expose the v2 owner index. Showing recent event data only.");
          }
        }
      } catch (err) {
        try {
          const logs = await getAgentRegisteredLogs(publicClient, RAGENT_CONTROLLER_ADDRESS, RAGENT_CONTROLLER_DEPLOY_BLOCK);
          if (!cancelled) {
            appendLogs(logs);
            setError("Owner index is not available yet. Showing recent event data only.");
          }
        } catch (fallbackErr) {
          if (!cancelled) {
            setError(fallbackErr instanceof Error ? fallbackErr.message : err instanceof Error ? err.message : "Could not load registered agents.");
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadHistoricalAgents();

    return () => {
      cancelled = true;
    };
  }, [address, appendLogs, publicClient]);

  useWatchContractEvent({
    address: RAGENT_CONTROLLER_ADDRESS,
    abi: ragentControllerAbi,
    eventName: "AgentRegistered",
    enabled: !!RAGENT_CONTROLLER_ADDRESS,
    onLogs: appendLogs,
  });

  return {
    agents,
    isLoading,
    error,
    isControllerConfigured: !!RAGENT_CONTROLLER_ADDRESS,
  };
}

async function getIndexedAgents(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  controllerAddress: NonNullable<typeof RAGENT_CONTROLLER_ADDRESS>,
  owner: Address,
): Promise<RegisteredAgent[]> {
  const count = await publicClient.readContract({
    address: controllerAddress,
    abi: ragentControllerAbi,
    functionName: "getAgentCountByOwner",
    args: [owner],
  });

  const ids: Hex[] = [];
  for (let offset = 0n; offset < count; offset += INDEX_PAGE_SIZE) {
    const limit = offset + INDEX_PAGE_SIZE > count ? count - offset : INDEX_PAGE_SIZE;
    const page = await publicClient.readContract({
      address: controllerAddress,
      abi: ragentControllerAbi,
      functionName: "getAgentIdsByOwner",
      args: [owner, offset, limit],
    });
    ids.push(...page);
  }

  if (ids.length === 0) return [];

  const configs = await publicClient.multicall({
    allowFailure: false,
    contracts: ids.map((id) => ({
      address: controllerAddress,
      abi: ragentControllerAbi,
      functionName: "getAgent",
      args: [id],
    })),
  });

  return configs.map((config, index) => mapConfigToAgent(ids[index], config as unknown as ControllerAgentConfig));
}

function mapConfigToAgent(id: Hex, config: ControllerAgentConfig): RegisteredAgent {
  return {
    id,
    owner: config.owner,
    agentType: agentTypeFromCode(Number(config.agentType)),
    userSalt: config.userSalt,
    secretsHash: config.secretsHash,
    name: config.name,
    symbol: config.symbol,
    memoryRef: config.memoryRef,
    outputRef: config.outputRef,
    active: config.active,
    source: "index",
  };
}

async function getAgentRegisteredLogs(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  controllerAddress: NonNullable<typeof RAGENT_CONTROLLER_ADDRESS>,
  fromBlock: bigint,
): Promise<AgentRegisteredLog[]> {
  const latestBlock = await publicClient.getBlockNumber();
  const logs: AgentRegisteredLog[] = [];

  for (let start = fromBlock; start <= latestBlock; start += EVENT_CHUNK_SIZE + 1n) {
    const end = start + EVENT_CHUNK_SIZE > latestBlock ? latestBlock : start + EVENT_CHUNK_SIZE;
    const chunk = await publicClient.getContractEvents({
      address: controllerAddress,
      abi: ragentControllerAbi,
      eventName: "AgentRegistered",
      fromBlock: start,
      toBlock: end,
    });
    logs.push(...chunk);
  }

  return logs;
}
