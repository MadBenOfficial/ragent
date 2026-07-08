import type { LucideIcon } from "lucide-react";

export type TopNavId = "foundry" | "agents" | "templates" | "integrations" | "docs";
export type RailToolId = "create" | "lab" | "modules" | "analytics" | "terminal" | "settings";
export type AgentTypeId = "sovereign" | "persistent";
export type StoragePlatform = "hf" | "gcs" | "pinata" | "inline";
export type RitualAsyncStatus =
  | "SUBMITTING"
  | "PENDING_COMMITMENT"
  | "COMMITTED"
  | "EXECUTOR_PROCESSING"
  | "RESULT_READY"
  | "PENDING_SETTLEMENT"
  | "SETTLED"
  | "FAILED"
  | "EXPIRED";

export interface StorageRef {
  platform: StoragePlatform;
  path: string;
  keyRef: string;
}

export interface ControllerStorageRef {
  platform: string;
  path: string;
  keyRef: string;
}

export interface SecretRef {
  key: string;
  label: string;
  encrypted: boolean;
  defaultValue?: string;
  sensitive?: boolean;
}

export interface SignedSecretBundle {
  encryptedSecret: `0x${string}`;
  secretsHash: `0x${string}`;
  keyCount: number;
  keyNames: string[];
  signature: string;
  storageChecks?: StorageValidationResult[];
}

export interface UserOwnedStorage {
  memory: StorageRef;
  knowledge: StorageRef;
  output: StorageRef;
  secrets: SecretRef[];
}

export type StorageValidationStatus = "ready" | "warning" | "blocked";

export interface StorageValidationResult {
  id: string;
  platform: StoragePlatform;
  keyRef: string;
  path: string;
  status: StorageValidationStatus;
  label: string;
  detail: string;
  checkedAt: string;
}

export interface RitualJob {
  id: string;
  txHash?: string;
  agentId?: string;
  status: RitualAsyncStatus;
  submittedAt: string;
}

export interface AsyncJobEvent {
  id: string;
  type: "JobAdded" | "Phase1Settled" | "ResultDelivered" | "JobRemoved";
  jobId: string;
  blockNumber?: string;
  txHash?: string;
  executor?: string;
  precompileAddress?: string;
  senderAddress?: string;
  commitBlock?: string;
  ttl?: string;
  success?: boolean;
  completed?: boolean;
  target?: string;
}

export interface RitualLaunchRecord {
  id: string;
  kind: "sovereign" | "persistent";
  status: RitualAsyncStatus;
  agentName: string;
  agentId?: string;
  txHash: `0x${string}`;
  userSalt: `0x${string}`;
  harnessAddress: `0x${string}`;
  executor: `0x${string}`;
  submittedBy?: `0x${string}`;
  submittedAt: string;
  updatedAt: string;
  jobId?: `0x${string}`;
  commitBlock?: string;
  ttl?: string;
  phase1Block?: string;
  deliveryTxHash?: `0x${string}`;
  completed?: boolean;
  success?: boolean;
  lastEvent?: AsyncJobEvent["type"];
}

export interface PreparedAgentRegistration {
  agentId?: string;
  userSalt: `0x${string}`;
  controllerAddress?: `0x${string}`;
  agentTypeCode: 0 | 1;
  memoryRef: ControllerStorageRef;
  outputRef: ControllerStorageRef;
  secretsHash: `0x${string}`;
}

export interface LaunchPreflightItem {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
  severity?: "ok" | "warn" | "block";
}

export interface IntegrationConfig {
  id: string;
  endpoint: string;
  enabled: boolean;
  allowPreflight: boolean;
  updatedAt: string;
}

export interface SovereignStorageTuple {
  platform: string;
  path: string;
  keyRef: string;
}

export interface SovereignAgentParams {
  executor: `0x${string}`;
  ttl: bigint;
  userPublicKey: `0x${string}`;
  pollIntervalBlocks: bigint;
  maxPollBlock: bigint;
  taskIdMarker: string;
  deliveryTarget: `0x${string}`;
  deliverySelector: `0x${string}`;
  deliveryGasLimit: bigint;
  deliveryMaxFeePerGas: bigint;
  deliveryMaxPriorityFeePerGas: bigint;
  cliType: number;
  prompt: string;
  encryptedSecrets: `0x${string}`;
  convoHistory: SovereignStorageTuple;
  output: SovereignStorageTuple;
  skills: SovereignStorageTuple[];
  systemPrompt: SovereignStorageTuple;
  model: string;
  tools: string[];
  maxTurns: number;
  maxTokens: number;
  rpcUrls: string;
}

export interface SovereignScheduleConfig {
  schedulerGas: number;
  frequency: number;
  schedulerTtl: number;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  value: bigint;
}

export interface PersistentLaunchSchedule {
  schedulerGas: number;
  schedulerTtl: number;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  value: bigint;
}

export interface SovereignLaunchPlan {
  kind: "sovereign";
  liveLaunchLocked: boolean;
  lockReason: string;
  userSalt: `0x${string}`;
  predictedChild?: `0x${string}`;
  compressedSalt?: `0x${string}`;
  childSalt?: `0x${string}`;
  executor?: `0x${string}`;
  model: string;
  cliLabel: string;
  totalFunding: bigint;
  dkmsFunding: bigint;
  schedulerFunding: bigint;
  params: SovereignAgentParams;
  schedule: SovereignScheduleConfig;
  schedulerLockDuration: bigint;
  windowNumCalls: number;
  preflight: LaunchPreflightItem[];
}

export interface PersistentLaunchPlan {
  kind: "persistent";
  liveLaunchLocked: boolean;
  lockReason: string;
  userSalt: `0x${string}`;
  predictedLauncher?: `0x${string}`;
  compressedSalt?: `0x${string}`;
  childSalt?: `0x${string}`;
  executor?: `0x${string}`;
  model?: string;
  providerLabel?: string;
  llmApiKeyRef?: string;
  persistentInput?: `0x${string}`;
  totalFunding: bigint;
  dkmsFunding: bigint;
  schedulerFunding: bigint;
  schedule?: PersistentLaunchSchedule;
  schedulerLockDuration: bigint;
  preflight: LaunchPreflightItem[];
}

export type AgentLaunchPlan = SovereignLaunchPlan | PersistentLaunchPlan;

export interface RegisteredAgent {
  id: string;
  owner: `0x${string}`;
  agentType: AgentTypeId;
  userSalt: `0x${string}`;
  secretsHash: `0x${string}`;
  name: string;
  symbol: string;
  memoryRef?: ControllerStorageRef;
  outputRef?: ControllerStorageRef;
  active?: boolean;
  source?: "index" | "events";
  txHash?: `0x${string}`;
  blockNumber?: string;
}

export interface AgentTypeOption {
  id: AgentTypeId;
  title: string;
  tag: string;
  description: string;
}

export interface AgentProfile {
  name: string;
  symbol: string;
  description: string;
  persona: string;
  voice: string;
  storage: UserOwnedStorage;
}

export interface CoreModule {
  id: string;
  title: string;
  icon: LucideIcon;
  lines: string[];
  side: "left" | "right";
  position: "top" | "middle" | "bottom";
}

export interface Capability {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: LucideIcon;
}

export interface NavItem {
  id: TopNavId;
  label: string;
}

export interface RailItem {
  id: RailToolId;
  label: string;
  icon: LucideIcon;
}

export interface AgentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  recommendedType: AgentTypeId;
  mission: string;
  cost: string;
}

export type IntegrationStatus = "Connected" | "Available" | "Experimental" | "Disabled";

export interface IntegrationItem {
  id: string;
  section: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  icon: LucideIcon;
}

export interface ModuleItem {
  id: string;
  name: string;
  description: string;
  status: "Enabled" | "Available" | "Experimental";
  category: string;
  icon: LucideIcon;
}

export interface DocSection {
  id: string;
  title: string;
  body: string;
}
