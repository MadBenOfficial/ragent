import { useCallback, useEffect, useState } from "react";
import type { Hex } from "viem";
import { useWatchContractEvent } from "wagmi";
import { asyncJobTrackerAbi } from "../lib/abis";
import {
  appendAsyncEvents,
  applyAsyncEventsToLaunchRecords,
  ASYNC_HISTORY_CHANGED_EVENT,
  clearAsyncHistory,
  loadAsyncEvents,
  loadLaunchRecords,
  saveLaunchRecords,
} from "../lib/asyncJobs";
import { RITUAL_SYSTEM_CONTRACTS } from "../lib/ritual";
import type { AsyncJobEvent, RitualLaunchRecord } from "../types";

function eventId(type: AsyncJobEvent["type"], jobId: Hex, txHash?: Hex) {
  return `${type}:${jobId}:${txHash ?? "pending"}`;
}

export function useAsyncJobEvents(enabled = true) {
  const [events, setEvents] = useState<AsyncJobEvent[]>(() => loadAsyncEvents());
  const [launchRecords, setLaunchRecords] = useState<RitualLaunchRecord[]>(() => loadLaunchRecords());

  const syncFromStorage = useCallback(() => {
    setEvents(loadAsyncEvents());
    setLaunchRecords(loadLaunchRecords());
  }, []);

  const scheduleSyncFromStorage = useCallback(() => {
    window.setTimeout(syncFromStorage, 32);
  }, [syncFromStorage]);

  const appendEvents = useCallback((nextEvents: AsyncJobEvent[]) => {
    const nextRecords = applyAsyncEventsToLaunchRecords(loadLaunchRecords(), nextEvents);
    saveLaunchRecords(nextRecords);
    setLaunchRecords(nextRecords);
    setEvents((current) => {
      const merged = appendAsyncEvents(current, nextEvents);
      return merged;
    });
  }, []);

  useEffect(() => {
    window.addEventListener(ASYNC_HISTORY_CHANGED_EVENT, scheduleSyncFromStorage);
    window.addEventListener("storage", scheduleSyncFromStorage);
    return () => {
      window.removeEventListener(ASYNC_HISTORY_CHANGED_EVENT, scheduleSyncFromStorage);
      window.removeEventListener("storage", scheduleSyncFromStorage);
    };
  }, [scheduleSyncFromStorage]);

  useWatchContractEvent({
    address: RITUAL_SYSTEM_CONTRACTS.asyncJobTracker,
    abi: asyncJobTrackerAbi,
    eventName: "JobAdded",
    enabled,
    onLogs: (logs) =>
      appendEvents(
        logs.map((log) => ({
          id: eventId("JobAdded", log.args.jobId as Hex, log.transactionHash),
          type: "JobAdded",
          jobId: log.args.jobId ?? "0x",
          blockNumber: log.blockNumber?.toString(),
          txHash: log.transactionHash,
          executor: log.args.executor,
          precompileAddress: log.args.precompileAddress,
          senderAddress: log.args.senderAddress,
          commitBlock: log.args.commitBlock?.toString(),
          ttl: log.args.ttl?.toString(),
        })),
      ),
  });

  useWatchContractEvent({
    address: RITUAL_SYSTEM_CONTRACTS.asyncJobTracker,
    abi: asyncJobTrackerAbi,
    eventName: "Phase1Settled",
    enabled,
    onLogs: (logs) =>
      appendEvents(
        logs.map((log) => ({
          id: eventId("Phase1Settled", log.args.jobId as Hex, log.transactionHash),
          type: "Phase1Settled",
          jobId: log.args.jobId ?? "0x",
          blockNumber: log.blockNumber?.toString(),
          txHash: log.transactionHash,
          executor: log.args.executor,
          commitBlock: log.args.settledBlock?.toString(),
        })),
      ),
  });

  useWatchContractEvent({
    address: RITUAL_SYSTEM_CONTRACTS.asyncJobTracker,
    abi: asyncJobTrackerAbi,
    eventName: "ResultDelivered",
    enabled,
    onLogs: (logs) =>
      appendEvents(
        logs.map((log) => ({
          id: eventId("ResultDelivered", log.args.jobId as Hex, log.transactionHash),
          type: "ResultDelivered",
          jobId: log.args.jobId ?? "0x",
          blockNumber: log.blockNumber?.toString(),
          txHash: log.transactionHash,
          target: log.args.target,
          success: log.args.success,
        })),
      ),
  });

  useWatchContractEvent({
    address: RITUAL_SYSTEM_CONTRACTS.asyncJobTracker,
    abi: asyncJobTrackerAbi,
    eventName: "JobRemoved",
    enabled,
    onLogs: (logs) =>
      appendEvents(
        logs.map((log) => ({
          id: eventId("JobRemoved", log.args.jobId as Hex, log.transactionHash),
          type: "JobRemoved",
          jobId: log.args.jobId ?? "0x",
          blockNumber: log.blockNumber?.toString(),
          txHash: log.transactionHash,
          executor: log.args.executor,
          completed: log.args.completed,
        })),
      ),
  });

  return {
    events,
    launchRecords,
    hasEvents: events.length > 0,
    hasLaunchRecords: launchRecords.length > 0,
    clearEvents: () => {
      clearAsyncHistory();
      setEvents([]);
      setLaunchRecords([]);
    },
  };
}
