import { describe, expect, it } from "vitest";
import type { AsyncJobEvent } from "../types";
import { applyAsyncEventToLaunchRecords, createSovereignLaunchRecord } from "./asyncJobs";

const txHash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
const userSalt = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as const;
const harness = "0x1111111111111111111111111111111111111111" as const;
const executor = "0x2222222222222222222222222222222222222222" as const;
const jobId = "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" as const;

function launchRecord() {
  return createSovereignLaunchRecord(
    {
      agentName: "Market Sentinel",
      txHash,
      userSalt,
      harnessAddress: harness,
      executor,
    },
    new Date("2026-07-02T00:00:00.000Z"),
  );
}

describe("async launch records", () => {
  it("creates a pending sovereign record without storing secrets", () => {
    const record = launchRecord();

    expect(record.status).toBe("PENDING_COMMITMENT");
    expect(record.txHash).toBe(txHash);
    expect(record.harnessAddress).toBe(harness);
    expect(JSON.stringify(record)).not.toContain("API_KEY");
  });

  it("matches JobAdded by harness sender and marks the launch committed", () => {
    const event: AsyncJobEvent = {
      id: "JobAdded:1",
      type: "JobAdded",
      jobId,
      senderAddress: harness,
      executor,
      commitBlock: "40200000",
      ttl: "500",
    };

    const [record] = applyAsyncEventToLaunchRecords([launchRecord()], event);

    expect(record.status).toBe("COMMITTED");
    expect(record.jobId).toBe(jobId);
    expect(record.commitBlock).toBe("40200000");
  });

  it("matches ResultDelivered by job id and closes the launch", () => {
    const committed = {
      ...launchRecord(),
      status: "COMMITTED" as const,
      jobId,
    };
    const event: AsyncJobEvent = {
      id: "ResultDelivered:1",
      type: "ResultDelivered",
      jobId,
      target: harness,
      success: true,
      txHash: "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    };

    const [record] = applyAsyncEventToLaunchRecords([committed], event);

    expect(record.status).toBe("SETTLED");
    expect(record.success).toBe(true);
    expect(record.deliveryTxHash).toBe(event.txHash);
  });
});
