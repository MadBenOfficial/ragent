import { type Address, type Hex } from "viem";
import { useAccount, useBlockNumber, useReadContract, useWriteContract } from "wagmi";
import { secretsAccessControlAbi } from "../lib/abis";
import { RITUAL_SYSTEM_CONTRACTS } from "../lib/ritual";

export const DEFAULT_SECRET_ACCESS_BLOCKS = 43_200n;

export const DEFAULT_SECRET_ACCESS_POLICY = {
  allowedDestinations: [],
  allowedMethods: [],
  allowedPaths: [],
  allowedQueryParams: [],
  allowedHeaders: [],
  secretLocation: "encryptedSecrets",
  bodyFormat: "json",
};

export function useSecretsAccess() {
  const { data: blockNumber } = useBlockNumber({ query: { refetchInterval: 15_000 } });
  const { writeContractAsync, isPending } = useWriteContract();

  async function grantAccess(delegate: Address, secretsHash: Hex, expiresInBlocks = DEFAULT_SECRET_ACCESS_BLOCKS) {
    if (blockNumber === undefined) {
      throw new Error("Block number is not loaded yet. Wait for the Ritual RPC connection, then retry.");
    }
    const expiresAt = blockNumber + expiresInBlocks;
    return writeContractAsync({
      address: RITUAL_SYSTEM_CONTRACTS.secretsAccessControl,
      abi: secretsAccessControlAbi,
      functionName: "grantAccess",
      args: [delegate, secretsHash, expiresAt, DEFAULT_SECRET_ACCESS_POLICY],
    });
  }

  async function revokeAccess(delegate: Address, secretsHash: Hex) {
    return writeContractAsync({
      address: RITUAL_SYSTEM_CONTRACTS.secretsAccessControl,
      abi: secretsAccessControlAbi,
      functionName: "revokeAccess",
      args: [delegate, secretsHash],
    });
  }

  return {
    blockNumber: blockNumber ?? 0n,
    defaultExpiresInBlocks: DEFAULT_SECRET_ACCESS_BLOCKS,
    grantAccess,
    revokeAccess,
    isPending,
  };
}

export function useSecretAccessStatus(delegate?: Address, secretsHash?: Hex) {
  const { address } = useAccount();

  const query = useReadContract({
    address: RITUAL_SYSTEM_CONTRACTS.secretsAccessControl,
    abi: secretsAccessControlAbi,
    functionName: "checkAccess",
    args: address && delegate && secretsHash ? [address, delegate, secretsHash] : undefined,
    query: {
      enabled: !!address && !!delegate && !!secretsHash,
      refetchInterval: 15_000,
    },
  });

  return {
    ...query,
    hasAccess: query.data?.[0] ?? false,
    policy: query.data?.[1],
  };
}
