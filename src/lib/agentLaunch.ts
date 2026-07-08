import { encodeAbiParameters, formatEther, parseAbiParameters, parseEther, toFunctionSelector, zeroAddress, type Address } from "viem";
import { integrations } from "../data/seedData";
import { integrationEffectiveStatus } from "./integrationStore";
import { RITUAL_CHAIN } from "./ritual";
import { storageChecksReady } from "./storageValidation";
import type {
  AgentProfile,
  Capability,
  IntegrationConfig,
  LaunchPreflightItem,
  PersistentLaunchPlan,
  PersistentLaunchSchedule,
  SignedSecretBundle,
  SovereignAgentParams,
  SovereignLaunchPlan,
  SovereignScheduleConfig,
  SovereignStorageTuple,
  StorageValidationResult,
} from "../types";

interface LaunchExecutor {
  teeAddress: Address;
}

interface BuildLaunchPlanInput {
  profile: AgentProfile;
  capabilities: Capability[];
  userSalt: `0x${string}`;
  isWalletConnected: boolean;
  selectedExecutor: LaunchExecutor | null;
  predictedSovereign?: readonly [Address, `0x${string}`, `0x${string}`];
  predictedPersistent?: readonly [Address, `0x${string}`, `0x${string}`];
  senderLocked: boolean;
  walletBalanceWei: bigint;
  secretBundle: SignedSecretBundle | null;
  dkmsFunding: bigint;
  schedulerFunding: bigint;
  storageChecks: StorageValidationResult[];
  integrationConfigs: Record<string, IntegrationConfig>;
}

export const SOVEREIGN_LAUNCH_DEFAULTS = {
  model: "zai-org/GLM-4.7-FP8",
  cliType: 6,
  cliLabel: "ZeroClaw",
  dkmsTtl: 500n,
  ttl: 500n,
  pollIntervalBlocks: 5n,
  maxPollBlock: 6000n,
  deliveryGasLimit: 3_000_000n,
  deliveryMaxFeePerGas: 1_000_000_000n,
  deliveryMaxPriorityFeePerGas: 100_000_000n,
  schedulerGas: 3_000_000,
  frequency: 2000,
  schedulerTtl: 500,
  schedulerMaxFeePerGas: 20_000_000_000n,
  schedulerMaxPriorityFeePerGas: 1_000_000_000n,
  schedulerValue: 0n,
  schedulerLockDuration: 100_000n,
  windowNumCalls: 5,
} as const;

export const PERSISTENT_LAUNCH_DEFAULTS = {
  model: "gpt-4o-mini",
  providerCode: 1,
  providerLabel: "OpenAI",
  agentRuntime: 0,
  dkmsTtl: 500n,
  ttl: 300n,
  maxSpawnBlock: 600n,
  deliveryGasLimit: 500_000n,
  deliveryMaxFeePerGas: 1_000_000_000n,
  deliveryMaxPriorityFeePerGas: 100_000_000n,
  schedulerGas: 5_000_000,
  schedulerTtl: 500,
  schedulerMaxFeePerGas: 20_000_000_000n,
  schedulerMaxPriorityFeePerGas: 1_000_000_000n,
  schedulerValue: 0n,
  schedulerLockDuration: 100_000n,
  minimumDkmsFunding: parseEther("1000"),
} as const;

const PERSISTENT_AGENT_ABI = parseAbiParameters([
  "address, bytes[], uint256, bytes[], bytes,",
  "uint64, address, bytes4, uint256, uint256, uint256, uint256,",
  "uint8, string, string,",
  "(string,string,string), (string,string,string),",
  "(string,string,string), (string,string,string),",
  "(string,string,string), (string,string,string),",
  "(string,string,string), (string,string,string),",
  "string, string, uint16",
].join(""));

export function formatRitualAmount(value: bigint) {
  return `${Number(formatEther(value)).toFixed(4)} RITUAL`;
}

export function buildAgentLaunchPlan(input: BuildLaunchPlanInput): SovereignLaunchPlan | PersistentLaunchPlan {
  if (input.profile.name.trim().length === 0 || input.profile.symbol.trim().length === 0) {
    return buildPersistentNotice(input, "Complete the agent name and symbol before preparing a launch.");
  }

  return buildSovereignLaunchPlan(input);
}

export function buildPersistentNotice(
  input: BuildLaunchPlanInput,
  reason?: string,
): PersistentLaunchPlan {
  const predicted = input.predictedPersistent;
  const predictedLauncher = predicted?.[0];
  const executor = input.selectedExecutor?.teeAddress;
  const totalFunding = input.dkmsFunding + input.schedulerFunding;
  const provider = getPersistentProvider(input.secretBundle?.keyNames ?? []);
  const storageProvidersReady = storageChecksReady(input.storageChecks, [input.profile.storage.memory, input.profile.storage.output]);
  const integrationGates = buildIntegrationPreflight(input.capabilities, input.integrationConfigs);
  const hasExternalDa = input.profile.storage.memory.platform !== "inline" || input.profile.storage.output.platform !== "inline";
  const schedule: PersistentLaunchSchedule = {
    schedulerGas: PERSISTENT_LAUNCH_DEFAULTS.schedulerGas,
    schedulerTtl: PERSISTENT_LAUNCH_DEFAULTS.schedulerTtl,
    maxFeePerGas: PERSISTENT_LAUNCH_DEFAULTS.schedulerMaxFeePerGas,
    maxPriorityFeePerGas: PERSISTENT_LAUNCH_DEFAULTS.schedulerMaxPriorityFeePerGas,
    value: PERSISTENT_LAUNCH_DEFAULTS.schedulerValue,
  };
  const persistentInput = executor && predictedLauncher && input.secretBundle && provider
    ? buildPersistentInput(input, executor, predictedLauncher, provider)
    : undefined;

  const blocks = [
    !input.isWalletConnected ? "wallet not connected" : "",
    !executor ? "executor pending" : "",
    !predictedLauncher ? "compressed launcher pending" : "",
    input.senderLocked ? "sender has a pending async job" : "",
    !input.secretBundle ? "secrets not encrypted" : "",
    !provider ? "persistent LLM API key missing" : "",
    !hasExternalDa ? "persistent DA provider missing" : "",
    !storageProvidersReady ? "storage provider not validated" : "",
    ...integrationGates.blocks,
    input.dkmsFunding < PERSISTENT_LAUNCH_DEFAULTS.minimumDkmsFunding ? "DKMS funding below persistent minimum" : "",
    input.schedulerFunding <= 0n ? "scheduler funding is 0 RITUAL" : "",
    input.walletBalanceWei < totalFunding ? "insufficient wallet balance" : "",
  ].filter(Boolean);

  return {
    kind: "persistent",
    liveLaunchLocked: blocks.length > 0,
    lockReason: reason ?? (blocks.length > 0 ? `Persistent launch locked: ${blocks.join(", ")}.` : "Ready for explicit wallet confirmation."),
    userSalt: input.userSalt,
    predictedLauncher,
    compressedSalt: predicted?.[1],
    childSalt: predicted?.[2],
    executor,
    model: provider?.model,
    providerLabel: provider?.label,
    llmApiKeyRef: provider?.keyRef,
    persistentInput,
    totalFunding,
    dkmsFunding: input.dkmsFunding,
    schedulerFunding: input.schedulerFunding,
    schedule,
    schedulerLockDuration: PERSISTENT_LAUNCH_DEFAULTS.schedulerLockDuration,
    preflight: [
      ready("wallet", "Wallet connected", input.isWalletConnected, "Connect the wallet before any onchain action."),
      ready("executor", "TEE executor", !!executor, "A valid HTTP-capability executor is required for persistent agents."),
      ready("prediction", "Launcher predicted", !!predictedLauncher, "Factory prediction will appear after wallet connection."),
      ready("sender", "Sender slot", !input.senderLocked, "Wait for the current async job to settle before launching."),
      ready("secrets", "Encrypted secrets", !!input.secretBundle, "Encrypt user-owned credentials before launch."),
      ready("llm", "Persistent LLM provider", !!provider, "Persistent agents require an external provider key such as OPENAI_API_KEY or ANTHROPIC_API_KEY."),
      ready("da", "Persistent DA provider", hasExternalDa, "Persistent agents require HuggingFace, Google Cloud Storage, or Pinata."),
      ready("storage-provider", "Storage provider access", storageProvidersReady, "Persistent agents require verified DA credentials for checkpointing."),
      ...integrationGates.items,
      ready("dkms-funding", "DKMS heartbeat funding", input.dkmsFunding >= PERSISTENT_LAUNCH_DEFAULTS.minimumDkmsFunding, `Minimum recommended: ${formatRitualAmount(PERSISTENT_LAUNCH_DEFAULTS.minimumDkmsFunding)}.`),
      ready("scheduler-funding", "Scheduler funding", input.schedulerFunding > 0n, "Set scheduler funding only when you explicitly want to spend RITUAL."),
      ready("balance", "Funding balance", input.walletBalanceWei >= totalFunding, `Wallet balance: ${formatRitualAmount(input.walletBalanceWei)}.`),
    ],
  };
}

export function buildSovereignLaunchPlan(input: BuildLaunchPlanInput): SovereignLaunchPlan {
  const predicted = input.predictedSovereign;
  const predictedChild = predicted?.[0];
  const executor = input.selectedExecutor?.teeAddress;
  const totalFunding = input.dkmsFunding + input.schedulerFunding;
  const enabledCapabilities = input.capabilities.filter((capability) => capability.enabled).map((capability) => capability.title);
  const params: SovereignAgentParams = {
    executor: executor ?? zeroAddress,
    ttl: SOVEREIGN_LAUNCH_DEFAULTS.ttl,
    userPublicKey: "0x",
    pollIntervalBlocks: SOVEREIGN_LAUNCH_DEFAULTS.pollIntervalBlocks,
    maxPollBlock: SOVEREIGN_LAUNCH_DEFAULTS.maxPollBlock,
    taskIdMarker: "RAGENT_TASK",
    deliveryTarget: predictedChild ?? zeroAddress,
    deliverySelector: toFunctionSelector("onSovereignAgentResult(bytes32,bytes)"),
    deliveryGasLimit: SOVEREIGN_LAUNCH_DEFAULTS.deliveryGasLimit,
    deliveryMaxFeePerGas: SOVEREIGN_LAUNCH_DEFAULTS.deliveryMaxFeePerGas,
    deliveryMaxPriorityFeePerGas: SOVEREIGN_LAUNCH_DEFAULTS.deliveryMaxPriorityFeePerGas,
    cliType: SOVEREIGN_LAUNCH_DEFAULTS.cliType,
    prompt: buildMissionPrompt(input.profile, enabledCapabilities),
    encryptedSecrets: input.secretBundle?.encryptedSecret ?? "0x",
    convoHistory: toSovereignStorage(input.profile.storage.memory),
    output: toSovereignStorage(input.profile.storage.output),
    skills: [],
    systemPrompt: {
      platform: "inline",
      path: buildSystemPrompt(input.profile),
      keyRef: "",
    },
    model: SOVEREIGN_LAUNCH_DEFAULTS.model,
    tools: [],
    maxTurns: 12,
    maxTokens: 4096,
    rpcUrls: JSON.stringify({ ritual: RITUAL_CHAIN.rpcUrl }),
  };

  const schedule: SovereignScheduleConfig = {
    schedulerGas: SOVEREIGN_LAUNCH_DEFAULTS.schedulerGas,
    frequency: SOVEREIGN_LAUNCH_DEFAULTS.frequency,
    schedulerTtl: SOVEREIGN_LAUNCH_DEFAULTS.schedulerTtl,
    maxFeePerGas: SOVEREIGN_LAUNCH_DEFAULTS.schedulerMaxFeePerGas,
    maxPriorityFeePerGas: SOVEREIGN_LAUNCH_DEFAULTS.schedulerMaxPriorityFeePerGas,
    value: SOVEREIGN_LAUNCH_DEFAULTS.schedulerValue,
  };

  const hasLlmProvider = input.secretBundle?.keyNames.includes("LLM_PROVIDER") ?? false;
  const memoryCredentialReady = storageCredentialReady(input.profile.storage.memory.keyRef, input.secretBundle);
  const outputCredentialReady = storageCredentialReady(input.profile.storage.output.keyRef, input.secretBundle);
  const storageProvidersReady = storageChecksReady(input.storageChecks, [input.profile.storage.memory, input.profile.storage.output]);
  const integrationGates = buildIntegrationPreflight(input.capabilities, input.integrationConfigs);

  const blocks = [
    !input.isWalletConnected ? "wallet not connected" : "",
    !executor ? "executor pending" : "",
    !predictedChild ? "compressed harness pending" : "",
    input.senderLocked ? "sender has a pending async job" : "",
    !input.secretBundle ? "secrets not encrypted" : "",
    !hasLlmProvider ? "LLM_PROVIDER missing" : "",
    !memoryCredentialReady ? "memory credential missing" : "",
    !outputCredentialReady ? "output credential missing" : "",
    !storageProvidersReady ? "storage provider not validated" : "",
    ...integrationGates.blocks,
    input.walletBalanceWei < totalFunding ? "insufficient wallet balance" : "",
    totalFunding <= 0n ? "funding is 0 RITUAL" : "",
  ].filter(Boolean);

  return {
    kind: "sovereign",
    liveLaunchLocked: blocks.length > 0,
    lockReason: blocks.length > 0 ? `Live launch locked: ${blocks.join(", ")}.` : "Ready for explicit wallet confirmation.",
    userSalt: input.userSalt,
    predictedChild,
    compressedSalt: predicted?.[1],
    childSalt: predicted?.[2],
    executor,
    model: SOVEREIGN_LAUNCH_DEFAULTS.model,
    cliLabel: SOVEREIGN_LAUNCH_DEFAULTS.cliLabel,
    totalFunding,
    dkmsFunding: input.dkmsFunding,
    schedulerFunding: input.schedulerFunding,
    params,
    schedule,
    schedulerLockDuration: SOVEREIGN_LAUNCH_DEFAULTS.schedulerLockDuration,
    windowNumCalls: SOVEREIGN_LAUNCH_DEFAULTS.windowNumCalls,
    preflight: [
      ready("wallet", "Wallet connected", input.isWalletConnected, "Connect the wallet before registration or launch."),
      ready("executor", "TEE executor", !!executor, "A valid HTTP-capability executor is required for agent jobs."),
      ready("prediction", "Compressed harness", !!predictedChild, "The factory must predict the child address first."),
      ready("sender", "Sender slot", !input.senderLocked, "Wait for the current async job to settle before launching."),
      ready("secrets", "Encrypted secrets", !!input.secretBundle, "Encrypt user-owned credentials before launch."),
      ready("llm", "LLM provider", hasLlmProvider, "Include LLM_PROVIDER=ritual in encrypted secrets for the default model."),
      ready("memory", "Memory credential", memoryCredentialReady, "The memory StorageRef keyRef must exist in encrypted secrets."),
      ready("output", "Output credential", outputCredentialReady, "The output StorageRef keyRef must exist in encrypted secrets."),
      ready("storage-provider", "Storage provider access", storageProvidersReady, "Validate HuggingFace, Google Cloud Storage, or Pinata credentials before launch."),
      ...integrationGates.items,
      ready("balance", "Funding balance", input.walletBalanceWei >= totalFunding, `Wallet balance: ${formatRitualAmount(input.walletBalanceWei)}.`),
      {
        id: "funding",
        label: "Live launch funding",
        ready: totalFunding > 0n,
        detail: totalFunding > 0n ? `Launch value: ${formatRitualAmount(totalFunding)}.` : "Set DKMS and scheduler funding only when you explicitly want to spend RITUAL.",
        severity: totalFunding > 0n ? "ok" : "block",
      },
    ],
  };
}

const CAPABILITY_INTEGRATION_REQUIREMENTS: Record<string, string[]> = {
  llm: ["llm-runtime"],
  http: ["http-endpoint"],
  scheduler: ["scheduler"],
  memory: ["memory-store"],
  wallet: ["evm-wallet"],
  secrets: ["secrets-vault"],
  zkfhe: ["zk-fhe"],
  actions: ["actions"],
};

function buildIntegrationPreflight(
  capabilities: Capability[],
  configs: Record<string, IntegrationConfig>,
) {
  const enabledIds = capabilities.filter((capability) => capability.enabled).map((capability) => capability.id);
  const requiredIds = Array.from(new Set(enabledIds.flatMap((id) => CAPABILITY_INTEGRATION_REQUIREMENTS[id] ?? [])));
  const items: LaunchPreflightItem[] = [];
  const blocks: string[] = [];

  for (const id of requiredIds) {
    const integration = integrations.find((item) => item.id === id);
    if (!integration) continue;
    const config = configs[id];
    const status = integrationEffectiveStatus(id, integration.status, configs);
    const gateReady = isIntegrationGateReady(id, config);
    const ready = status !== "Disabled" && gateReady;
    if (!ready) blocks.push(`${integration.name} integration not ready`);
    items.push({
      id: `integration-${id}`,
      label: `${integration.name} integration`,
      ready,
      detail: integrationGateDetail(integration.name, config, status, gateReady),
      severity: ready ? "ok" : "block",
    });
  }

  return { items, blocks };
}

function isIntegrationGateReady(id: string, config: IntegrationConfig | undefined) {
  if (!config) return true;
  if (!config.enabled) return false;
  if (!config.allowPreflight) return true;
  return isIntegrationEndpointValid(id, config.endpoint);
}

function integrationGateDetail(name: string, config: IntegrationConfig | undefined, status: string, gateReady: boolean) {
  if (!config) return `${name} uses the default ${status.toLowerCase()} integration profile.`;
  if (!config.enabled) return `${name} is disabled in Integrations.`;
  if (!config.allowPreflight) return `${name} preflight gate is disabled by the user.`;
  if (!gateReady) return `${name} endpoint/input is incomplete or invalid.`;
  return `${name} preflight gate is enabled and configured.`;
}

function isIntegrationEndpointValid(id: string, endpoint: string) {
  const value = endpoint.trim();
  if (!value) return false;
  if (id.includes("http") || id.includes("webhook") || id === "rss" || id === "price-feed" || id === "ritual-testnet") {
    return /^https?:\/\//i.test(value);
  }
  if (id === "memory-store") {
    return /^(hf|gcs|pinata):\/\//i.test(value);
  }
  if (id === "callback" || id === "evm-wallet") {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
  }
  return true;
}

function toSovereignStorage(ref: { platform: string; path: string; keyRef: string }): SovereignStorageTuple {
  return {
    platform: ref.platform,
    path: ref.path,
    keyRef: ref.keyRef,
  };
}

function storageCredentialReady(keyRef: string, bundle: SignedSecretBundle | null) {
  if (!keyRef || keyRef.startsWith("dkms_encrypted:")) return true;
  return bundle?.keyNames.includes(keyRef) ?? false;
}

function ready(id: string, label: string, ok: boolean, detail: string): LaunchPreflightItem {
  return {
    id,
    label,
    ready: ok,
    detail,
    severity: ok ? "ok" : "warn",
  };
}

function buildMissionPrompt(profile: AgentProfile, capabilities: string[]) {
  return [
    `You are ${profile.name}.`,
    profile.description,
    `Persona: ${profile.persona}. Voice: ${profile.voice}.`,
    `Enabled capabilities: ${capabilities.length ? capabilities.join(", ") : "none"}.`,
    "Operate conservatively. Prefer analysis, explain decisions, and never spend funds unless the user has approved the action policy.",
  ].join("\n");
}

function buildSystemPrompt(profile: AgentProfile) {
  return [
    `RAgent system profile for ${profile.name}.`,
    "Use user-owned StorageRefs for memory and outputs.",
    "Treat encrypted secrets as private executor-only credentials.",
    "Return concise status, risk notes, and any updated storage references.",
  ].join("\n");
}

function buildPersistentInput(
  input: BuildLaunchPlanInput,
  executor: Address,
  deliveryTarget: Address,
  provider: PersistentProvider,
) {
  const refs = buildPersistentRefs(input.profile);
  return encodeAbiParameters(PERSISTENT_AGENT_ABI, [
    executor,
    [input.secretBundle?.encryptedSecret ?? "0x"],
    PERSISTENT_LAUNCH_DEFAULTS.ttl,
    [input.secretBundle?.signature ?? "0x"],
    "0x",
    PERSISTENT_LAUNCH_DEFAULTS.maxSpawnBlock,
    deliveryTarget,
    toFunctionSelector("onPersistentAgentResult(bytes32,bytes)"),
    PERSISTENT_LAUNCH_DEFAULTS.deliveryGasLimit,
    PERSISTENT_LAUNCH_DEFAULTS.deliveryMaxFeePerGas,
    PERSISTENT_LAUNCH_DEFAULTS.deliveryMaxPriorityFeePerGas,
    0n,
    provider.code,
    provider.model,
    provider.keyRef,
    refs.daConfig,
    refs.soulRef,
    refs.agentsRef,
    refs.userRef,
    refs.memoryRef,
    refs.identityRef,
    refs.toolsRef,
    refs.openclawConfigRef,
    "",
    JSON.stringify({ ritual: RITUAL_CHAIN.rpcUrl }),
    PERSISTENT_LAUNCH_DEFAULTS.agentRuntime,
  ]);
}

interface PersistentProvider {
  code: number;
  label: string;
  model: string;
  keyRef: string;
}

function getPersistentProvider(keyNames: string[]): PersistentProvider | null {
  if (keyNames.includes("OPENAI_API_KEY")) return { code: 1, label: "OpenAI", model: "gpt-4o-mini", keyRef: "OPENAI_API_KEY" };
  if (keyNames.includes("ANTHROPIC_API_KEY")) return { code: 0, label: "Anthropic", model: "claude-sonnet-4-5-20250929", keyRef: "ANTHROPIC_API_KEY" };
  if (keyNames.includes("GEMINI_API_KEY")) return { code: 2, label: "Gemini", model: "gemini-2.5-flash", keyRef: "GEMINI_API_KEY" };
  if (keyNames.includes("OPENROUTER_API_KEY")) return { code: 4, label: "OpenRouter", model: "anthropic/claude-3.5-sonnet", keyRef: "OPENROUTER_API_KEY" };
  if (keyNames.includes("XAI_API_KEY")) return { code: 3, label: "xAI", model: "grok-2-latest", keyRef: "XAI_API_KEY" };
  return null;
}

function buildPersistentRefs(profile: AgentProfile) {
  const storage = profile.storage.memory.platform === "inline" ? profile.storage.output : profile.storage.memory;
  const keyRef = storage.keyRef;
  return {
    daConfig: toPersistentStorage(profile.storage.output, "manifest.json"),
    soulRef: toPersistentStorage(storage, "SOUL.md"),
    agentsRef: toPersistentStorage(storage, "AGENTS.md"),
    userRef: toPersistentStorage(storage, "USER.md"),
    memoryRef: toPersistentStorage(storage, "MEMORY.md"),
    identityRef: toPersistentStorage(storage, "IDENTITY.md"),
    toolsRef: toPersistentStorage(storage, "TOOLS.md"),
    openclawConfigRef: {
      platform: storage.platform,
      path: persistentSiblingPath(storage.path, "runtime.json"),
      keyRef,
    },
  };
}

function toPersistentStorage(ref: { platform: string; path: string; keyRef: string }, filename: string): SovereignStorageTuple {
  return {
    platform: ref.platform,
    path: persistentSiblingPath(ref.path, filename),
    keyRef: ref.keyRef,
  };
}

function persistentSiblingPath(path: string, filename: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 2) return [...parts, filename].join("/");
  return [...parts.slice(0, -1), filename].join("/");
}
