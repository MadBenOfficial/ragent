import type { AgentTypeId } from "../types";

export const SETTINGS_STORAGE_KEY = "ragent.workspace.settings";
export const SETTINGS_CHANGED_EVENT = "ragent:settings-changed";

export interface WorkspaceSettings {
  defaultAgentType: AgentTypeId;
  defaultVoice: string;
  confirmBeforeLaunch: boolean;
  compactActivityLog: boolean;
}

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  defaultAgentType: "sovereign",
  defaultVoice: "Precise & Concise",
  confirmBeforeLaunch: true,
  compactActivityLog: false,
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function loadSettings(storage: StorageLike | undefined = getBrowserStorage()): WorkspaceSettings {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<WorkspaceSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(
  next: WorkspaceSettings,
  storage: StorageLike | undefined = getBrowserStorage(),
): WorkspaceSettings {
  storage?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT, { detail: next }));
  }
  return next;
}

function getBrowserStorage(): StorageLike | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}
