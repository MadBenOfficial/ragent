import { keccak256, toBytes, zeroHash, type Address, type Hex } from "viem";
import type { AgentProfile, AgentTypeId, ControllerStorageRef, StorageRef } from "../types";

export function toControllerStorageRef(ref: StorageRef): ControllerStorageRef {
  return {
    platform: ref.platform,
    path: ref.path,
    keyRef: ref.keyRef,
  };
}

export function agentTypeToCode(agentType: AgentTypeId): 0 | 1 {
  return agentType === "sovereign" ? 0 : 1;
}

export function makeUserSalt(owner: Address | undefined, profile: AgentProfile): Hex {
  const seed = [owner ?? "0x0000000000000000000000000000000000000000", profile.symbol, profile.name].join(":");
  return keccak256(toBytes(seed));
}

export function normalizeSecretsHash(secretsHash?: Hex): Hex {
  return secretsHash ?? zeroHash;
}
