import type { IntegrationConfig } from "../types";

export const INTEGRATION_CONFIG_STORAGE_KEY = "ragent.integration.configs";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function loadIntegrationConfigs(storage: StorageLike | undefined = getBrowserStorage()): Record<string, IntegrationConfig> {
  if (!storage) return {};
  try {
    const raw = storage.getItem(INTEGRATION_CONFIG_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, IntegrationConfig>) : {};
  } catch {
    return {};
  }
}

export function saveIntegrationConfig(
  config: Omit<IntegrationConfig, "updatedAt">,
  storage: StorageLike | undefined = getBrowserStorage(),
) {
  const configs = loadIntegrationConfigs(storage);
  const next = {
    ...configs,
    [config.id]: {
      ...config,
      updatedAt: new Date().toISOString(),
    },
  };
  storage?.setItem(INTEGRATION_CONFIG_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function integrationEffectiveStatus(id: string, fallback: string, configs: Record<string, IntegrationConfig>) {
  const config = configs[id];
  if (!config) return fallback;
  return config.enabled ? "Connected" : "Disabled";
}

function getBrowserStorage(): StorageLike | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}
