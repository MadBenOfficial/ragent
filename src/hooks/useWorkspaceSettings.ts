import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  SETTINGS_CHANGED_EVENT,
  saveSettings,
  type WorkspaceSettings,
} from "../lib/settingsStore";

export function useWorkspaceSettings() {
  const [settings, setSettings] = useState<WorkspaceSettings>(() => loadSettings());

  const sync = useCallback(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    window.addEventListener(SETTINGS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SETTINGS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const update = useCallback(<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      saveSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(saveSettings({ ...DEFAULT_SETTINGS }));
  }, []);

  return { settings, update, reset };
}
