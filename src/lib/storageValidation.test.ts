import { describe, expect, it } from "vitest";
import { storageChecksReady, validateStorageRefShape } from "./storageValidation";
import type { StorageRef, StorageValidationResult } from "../types";

describe("validateStorageRefShape", () => {
  it("accepts HuggingFace dataset file paths", () => {
    expect(validateStorageRefShape({ platform: "hf", path: "owner/repo/memory.jsonl", keyRef: "HF_TOKEN" })).toBeNull();
  });

  it("rejects incomplete HuggingFace paths", () => {
    expect(validateStorageRefShape({ platform: "hf", path: "owner/repo", keyRef: "HF_TOKEN" })).toContain("owner/repo/path");
  });

  it("accepts empty Pinata path for first upload", () => {
    expect(validateStorageRefShape({ platform: "pinata", path: "", keyRef: "PINATA_CREDS" })).toBeNull();
  });

  it("requires keyRef for external providers", () => {
    expect(validateStorageRefShape({ platform: "gcs", path: "agents/output.jsonl", keyRef: "" })).toContain("keyRef");
  });
});

describe("storageChecksReady", () => {
  const refs: StorageRef[] = [
    { platform: "hf", path: "owner/repo/memory.jsonl", keyRef: "HF_TOKEN" },
    { platform: "inline", path: "system prompt", keyRef: "" },
  ];
  const checks: StorageValidationResult[] = [
    {
      id: "hf:HF_TOKEN:owner/repo/memory.jsonl",
      platform: "hf",
      keyRef: "HF_TOKEN",
      path: "owner/repo/memory.jsonl",
      status: "ready",
      label: "HuggingFace ready",
      detail: "ok",
      checkedAt: "2026-07-02T00:00:00.000Z",
    },
  ];

  it("requires every external ref to have a ready check", () => {
    expect(storageChecksReady(checks, refs)).toBe(true);
    expect(storageChecksReady([], refs)).toBe(false);
  });
});
