import { describe, expect, it } from "vitest";
import { zeroHash } from "viem";
import { agentTypeToCode, makeUserSalt, normalizeSecretsHash, toControllerStorageRef } from "./storage";
import { initialProfile } from "../data/seedData";

describe("storage helpers", () => {
  it("maps UI storage refs into controller storage refs", () => {
    expect(toControllerStorageRef(initialProfile.storage.memory)).toEqual({
      platform: initialProfile.storage.memory.platform,
      path: initialProfile.storage.memory.path,
      keyRef: initialProfile.storage.memory.keyRef,
    });
  });

  it("prepares deterministic agent type, salt and empty secret hash values", () => {
    const owner = "0x0000000000000000000000000000000000000abc";

    expect(agentTypeToCode("sovereign")).toBe(0);
    expect(agentTypeToCode("persistent")).toBe(1);
    expect(makeUserSalt(owner, initialProfile)).toBe(makeUserSalt(owner, initialProfile));
    expect(normalizeSecretsHash()).toBe(zeroHash);
  });
});
