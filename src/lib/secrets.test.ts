import { describe, expect, it } from "vitest";
import { decrypt, ECIES_CONFIG, PrivateKey } from "eciesjs";
import { hexToBytes, isHex } from "viem";
import { encryptSecretMap } from "./secrets";

describe("encryptSecretMap", () => {
  it("encrypts a filtered secret map and produces a decryptable payload", () => {
    const privateKey = new PrivateKey();
    const publicKey = `0x${privateKey.publicKey.toHex(false)}` as const;

    const bundle = encryptSecretMap(publicKey, {
      HF_TOKEN: "hf_test",
      EMPTY: "",
      PINATA_JWT: "pinata_test",
    });

    const decrypted = decrypt(privateKey.toHex(), hexToBytes(bundle.encryptedSecret));
    const decoded = JSON.parse(new TextDecoder().decode(decrypted)) as Record<string, string>;

    expect(ECIES_CONFIG.symmetricNonceLength).toBe(12);
    expect(isHex(bundle.encryptedSecret)).toBe(true);
    expect(isHex(bundle.secretsHash)).toBe(true);
    expect(bundle.keyCount).toBe(2);
    expect(bundle.keyNames).toEqual(["HF_TOKEN", "PINATA_JWT"]);
    expect(decoded).toEqual({
      HF_TOKEN: "hf_test",
      PINATA_JWT: "pinata_test",
    });
  });

  it("rejects empty secret input", () => {
    const privateKey = new PrivateKey();
    const publicKey = `0x${privateKey.publicKey.toHex(false)}` as const;

    expect(() => encryptSecretMap(publicKey, { HF_TOKEN: "" })).toThrow("Add at least one secret value");
  });
});
