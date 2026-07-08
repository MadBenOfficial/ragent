import type { Address, Hex } from "viem";
import type { AsyncJobEvent, RitualAsyncStatus, RitualLaunchRecord } from "../types";

export const ASYNC_EVENT_STORAGE_KEY = "ragent.async.events";
export const LAUNCH_RECORD_STORAGE_KEY = "ragent.launch.records";
export const ASYNC_HISTORY_CHANGED_EVENT = "ragent:async-history-changed";
const MAX_EVENTS = 50;
const MAX_RECORDS = 40;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface CreateLaunchRecordInput {
  kind?: RitualLaunchRecord["kind"];
  agentName: string;
  agentId?: string;
  txHash: Hex;
  userSalt: Hex;
  harnessAddress: Address;
  executor: Address;
  submittedBy?: Address;
}

export function createSovereignLaunchRecord(input: CreateLaunchRecordInput, now = new Date()): RitualLaunchRecord {
  const timestamp = now.toISOString();
  const kind = input.kind ?? "sovereign";
  return {
    id: `${kind}:${input.txHash}`,
    kind,
    status: "PENDING_COMMITMENT",
    agentName: input.agentName,
    agentId: input.agentId,
    txHash: input.txHash,
    userSalt: input.userSalt,
    harnessAddress: input.harnessAddress,
    executor: input.executor,
    submittedBy: input.submittedBy,
    submittedAt: timestamp,
    updatedAt: timestamp,
  };
}

export function loadAsyncEvents(storage: StorageLike | undefined = getBrowserStorage()): AsyncJobEvent[] {
  return readJson<AsyncJobEvent[]>(storage, ASYNC_EVENT_STORAGE_KEY, []);
}

export function saveAsyncEvents(events: AsyncJobEvent[], storage: StorageLike | undefined = getBrowserStorage()) {
  writeJson(storage, ASYNC_EVENT_STORAGE_KEY, uniqueEvents(events).slice(0, MAX_EVENTS));
  notifyHistoryChanged();
}

export function appendAsyncEvents(
  current: AsyncJobEvent[],
  next: AsyncJobEvent[],
  storage: StorageLike | undefined = getBrowserStorage(),
) {
  const merged = uniqueEvents([...next, ...current]).slice(0, MAX_EVENTS);
  saveAsyncEvents(merged, storage);
  return merged;
}

export function loadLaunchRecords(storage: StorageLike | undefined = getBrowserStorage()): RitualLaunchRecord[] {
  return readJson<RitualLaunchRecord[]>(storage, LAUNCH_RECORD_STORAGE_KEY, []);
}

export function saveLaunchRecords(records: RitualLaunchRecord[], storage: StorageLike | undefined = getBrowserStorage()) {
  writeJson(storage, LAUNCH_RECORD_STORAGE_KEY, uniqueRecords(records).slice(0, MAX_RECORDS));
  notifyHistoryChanged();
}

export function addLaunchRecord(
  record: RitualLaunchRecord,
  records = loadLaunchRecords(),
  storage: StorageLike | undefined = getBrowserStorage(),
) {
  const merged = uniqueRecords([record, ...records]).slice(0, MAX_RECORDS);
  saveLaunchRecords(merged, storage);
  return merged;
}

export function clearAsyncHistory(storage: StorageLike | undefined = getBrowserStorage()) {
  storage?.removeItem(ASYNC_EVENT_STORAGE_KEY);
  storage?.removeItem(LAUNCH_RECORD_STORAGE_KEY);
  notifyHistoryChanged();
}

export function applyAsyncEventsToLaunchRecords(records: RitualLaunchRecord[], events: AsyncJobEvent[]) {
  return events.reduce(applyAsyncEventToLaunchRecords, records);
}

export function applyAsyncEventToLaunchRecords(records: RitualLaunchRecord[], event: AsyncJobEvent) {
  let changed = false;
  const updated = records.map((record) => {
    if (!matchesRecord(record, event)) return record;
    changed = true;
    return applyEvent(record, event);
  });
  return changed ? uniqueRecords(updated) : records;
}

function applyEvent(record: RitualLaunchRecord, event: AsyncJobEvent): RitualLaunchRecord {
  const base = {
    ...record,
    updatedAt: new Date().toISOString(),
    lastEvent: event.type,
  };

  if (event.type === "JobAdded") {
    return {
      ...base,
      status: "COMMITTED",
      jobId: asHex(event.jobId),
      commitBlock: event.commitBlock,
      ttl: event.ttl,
    };
  }

  if (event.type === "Phase1Settled") {
    return {
      ...base,
      status: "PENDING_SETTLEMENT",
      jobId: asHex(event.jobId),
      phase1Block: event.commitBlock,
    };
  }

  if (event.type === "ResultDelivered") {
    return {
      ...base,
      status: event.success ? "SETTLED" : "FAILED",
      jobId: asHex(event.jobId),
      deliveryTxHash: asHex(event.txHash),
      success: event.success,
    };
  }

  return {
    ...base,
    status: event.completed ? "SETTLED" : terminalOrExpired(record.status),
    jobId: asHex(event.jobId),
    completed: event.completed,
  };
}

function matchesRecord(record: RitualLaunchRecord, event: AsyncJobEvent) {
  if (event.jobId && record.jobId?.toLowerCase() === event.jobId.toLowerCase()) return true;
  if (event.type === "JobAdded" && event.senderAddress?.toLowerCase() === record.harnessAddress.toLowerCase()) return true;
  if (event.type === "ResultDelivered" && event.target?.toLowerCase() === record.harnessAddress.toLowerCase()) return true;
  return false;
}

function terminalOrExpired(status: RitualAsyncStatus): RitualAsyncStatus {
  return status === "SETTLED" || status === "FAILED" ? status : "EXPIRED";
}

function uniqueEvents(events: AsyncJobEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

function uniqueRecords(records: RitualLaunchRecord[]) {
  const byId = new Map<string, RitualLaunchRecord>();
  for (const record of records) byId.set(record.id, record);
  return Array.from(byId.values()).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function readJson<T>(storage: StorageLike | undefined, key: string, fallback: T): T {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(storage: StorageLike | undefined, key: string, value: T) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

function getBrowserStorage(): StorageLike | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

function notifyHistoryChanged() {
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      window.dispatchEvent(new Event(ASYNC_HISTORY_CHANGED_EVENT));
    }, 0);
  }
}

function asHex(value: string | undefined) {
  return value && value.startsWith("0x") ? (value as Hex) : undefined;
}
