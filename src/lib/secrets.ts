import { bytesToHex, hexToBytes, keccak256, type Hex } from "viem";
import { ECIES_CONFIG, encrypt } from "eciesjs";

ECIES_CONFIG.symmetricNonceLength = 12;

export interface EncryptedSecretBundle {
  encryptedSecret: Hex;
  secretsHash: Hex;
  keyCount: number;
  keyNames: string[];
}

export function encryptSecretMap(executorPublicKey: Hex, secrets: Record<string, string>): EncryptedSecretBundle {
  const filtered = Object.fromEntries(
    Object.entries(secrets)
      .map(([key, value]) => [key.trim(), value] as const)
      .filter(([key, value]) => key.length > 0 && value.length > 0),
  );
  const keyNames = Object.keys(filtered);

  if (keyNames.length === 0) {
    throw new Error("Add at least one secret value before encrypting.");
  }

  if (!executorPublicKey || executorPublicKey === "0x") {
    throw new Error("Executor public key is required.");
  }

  const payload = new TextEncoder().encode(JSON.stringify(filtered));
  const encryptedBytes = encrypt(executorPublicKey.slice(2), payload);
  const encryptedSecret = bytesToHex(encryptedBytes);
  const secretsHash = keccak256(hexToBytes(encryptedSecret));

  return {
    encryptedSecret,
    secretsHash,
    keyCount: keyNames.length,
    keyNames,
  };
}

export function truncateHex(value: string, head = 8, tail = 6) {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
