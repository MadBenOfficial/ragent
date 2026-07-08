import { describe, expect, it } from "vitest";
import { parseEther, zeroAddress } from "viem";
import { initialCapabilities, initialProfile } from "../data/seedData";
import type { SignedSecretBundle, StorageValidationResult } from "../types";
import { buildPersistentNotice, buildSovereignLaunchPlan, SOVEREIGN_LAUNCH_DEFAULTS } from "./agentLaunch";

const userSalt = "0x1111111111111111111111111111111111111111111111111111111111111111" as const;
const executor = "0x1111111111111111111111111111111111111111" as const;
const predictedChild = "0x2222222222222222222222222222222222222222" as const;
const compressedSalt = "0x2222222222222222222222222222222222222222222222222222222222222222" as const;
const childSalt = "0x3333333333333333333333333333333333333333333333333333333333333333" as const;

const secretBundle: SignedSecretBundle = {
  encryptedSecret: "0x1234",
  secretsHash: "0x4444444444444444444444444444444444444444444444444444444444444444",
  keyCount: 2,
  keyNames: ["LLM_PROVIDER", "HF_TOKEN"],
  signature: "0xsigned",
};

const storageChecks: StorageValidationResult[] = [
  {
    id: `hf:HF_TOKEN:${initialProfile.storage.memory.path}`,
    platform: "hf",
    keyRef: "HF_TOKEN",
    path: initialProfile.storage.memory.path,
    status: "ready",
    label: "HuggingFace ready",
    detail: "dataset accessible",
    checkedAt: "2026-07-02T00:00:00.000Z",
  },
  {
    id: `hf:HF_TOKEN:${initialProfile.storage.output.path}`,
    platform: "hf",
    keyRef: "HF_TOKEN",
    path: initialProfile.storage.output.path,
    status: "ready",
    label: "HuggingFace ready",
    detail: "dataset accessible",
    checkedAt: "2026-07-02T00:00:00.000Z",
  },
];

function readyInput(overrides: Partial<Parameters<typeof buildSovereignLaunchPlan>[0]> = {}) {
  return {
    profile: initialProfile,
    capabilities: initialCapabilities,
    userSalt,
    isWalletConnected: true,
    selectedExecutor: { teeAddress: executor },
    predictedSovereign: [predictedChild, compressedSalt, childSalt] as const,
    predictedPersistent: undefined,
    senderLocked: false,
    walletBalanceWei: parseEther("1"),
    secretBundle,
    storageChecks,
    integrationConfigs: {},
    dkmsFunding: parseEther("0.001"),
    schedulerFunding: parseEther("0.002"),
    ...overrides,
  };
}

describe("buildSovereignLaunchPlan", () => {
  it("unlocks a sovereign launch when every preflight dependency is ready", () => {
    const plan = buildSovereignLaunchPlan(readyInput());

    expect(plan.kind).toBe("sovereign");
    expect(plan.liveLaunchLocked).toBe(false);
    expect(plan.executor).toBe(executor);
    expect(plan.predictedChild).toBe(predictedChild);
    expect(plan.params.deliveryTarget).toBe(predictedChild);
    expect(plan.params.executor).toBe(executor);
    expect(plan.params.encryptedSecrets).toBe(secretBundle.encryptedSecret);
    expect(plan.params.convoHistory.path).toBe(initialProfile.storage.memory.path);
    expect(plan.params.output.path).toBe(initialProfile.storage.output.path);
    expect(plan.schedule.frequency).toBe(SOVEREIGN_LAUNCH_DEFAULTS.frequency);
    expect(plan.windowNumCalls).toBe(SOVEREIGN_LAUNCH_DEFAULTS.windowNumCalls);
  });

  it("locks launch when funding or encrypted credentials are missing", () => {
    const plan = buildSovereignLaunchPlan(readyInput({ secretBundle: null, dkmsFunding: 0n, schedulerFunding: 0n }));

    expect(plan.liveLaunchLocked).toBe(true);
    expect(plan.lockReason).toContain("secrets not encrypted");
    expect(plan.lockReason).toContain("LLM_PROVIDER missing");
    expect(plan.lockReason).toContain("funding is 0 RITUAL");
  });

  it("locks launch when storage provider credentials were not validated", () => {
    const plan = buildSovereignLaunchPlan(readyInput({ storageChecks: [] }));

    expect(plan.liveLaunchLocked).toBe(true);
    expect(plan.lockReason).toContain("storage provider not validated");
  });

  it("locks launch when a required integration preflight gate is disabled", () => {
    const plan = buildSovereignLaunchPlan(
      readyInput({
        integrationConfigs: {
          "http-endpoint": {
            id: "http-endpoint",
            endpoint: "https://api.example.com/agent-signal",
            enabled: false,
            allowPreflight: true,
            updatedAt: "2026-07-02T00:00:00.000Z",
          },
        },
      }),
    );

    expect(plan.liveLaunchLocked).toBe(true);
    expect(plan.lockReason).toContain("HTTP Endpoint integration not ready");
    expect(plan.preflight.some((item) => item.id === "integration-http-endpoint" && !item.ready)).toBe(true);
  });

  it("accepts a configured integration preflight gate when the endpoint is valid", () => {
    const plan = buildSovereignLaunchPlan(
      readyInput({
        integrationConfigs: {
          "http-endpoint": {
            id: "http-endpoint",
            endpoint: "https://api.example.com/agent-signal",
            enabled: true,
            allowPreflight: true,
            updatedAt: "2026-07-02T00:00:00.000Z",
          },
        },
      }),
    );

    expect(plan.liveLaunchLocked).toBe(false);
    expect(plan.preflight.some((item) => item.id === "integration-http-endpoint" && item.ready)).toBe(true);
  });

  it("uses zero addresses only while wallet prediction or executor discovery is incomplete", () => {
    const plan = buildSovereignLaunchPlan(
      readyInput({
        selectedExecutor: null,
        predictedSovereign: undefined,
      }),
    );

    expect(plan.liveLaunchLocked).toBe(true);
    expect(plan.params.executor).toBe(zeroAddress);
    expect(plan.params.deliveryTarget).toBe(zeroAddress);
  });
});

describe("buildPersistentNotice", () => {
  it("keeps persistent launch locked until real provider and high DKMS funding are ready", () => {
    const plan = buildPersistentNotice(readyInput());

    expect(plan.kind).toBe("persistent");
    expect(plan.liveLaunchLocked).toBe(true);
    expect(plan.lockReason).toContain("persistent LLM API key missing");
    expect(plan.lockReason).toContain("DKMS funding below persistent minimum");
  });
});
