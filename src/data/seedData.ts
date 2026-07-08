import {
  Activity,
  AlertTriangle,
  Bell,
  BrainCircuit,
  Box,
  Bot,
  ChartNoAxesCombined,
  CircleDotDashed,
  ClipboardList,
  Cloud,
  Code2,
  Database,
  FileText,
  Fingerprint,
  FlaskConical,
  Gauge,
  GitBranch,
  Goal,
  Globe2,
  KeyRound,
  Lock,
  Network,
  PlugZap,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Timer,
  WalletCards,
  Workflow,
  Zap,
} from "lucide-react";
import type {
  AgentProfile,
  AgentTemplate,
  AgentTypeOption,
  Capability,
  CoreModule,
  DocSection,
  IntegrationItem,
  ModuleItem,
  NavItem,
  RailItem,
} from "../types";

export const appMeta = {
  name: "RAgent",
  network: "RITUAL Testnet",
  version: "0.1.0",
};

export const navItems: NavItem[] = [
  { id: "foundry", label: "Foundry" },
  { id: "agents", label: "Agents" },
  { id: "templates", label: "Templates" },
  { id: "integrations", label: "Integrations" },
  { id: "docs", label: "Docs" },
];

export const railItems: RailItem[] = [
  { id: "create", label: "Create", icon: Sparkles },
  { id: "lab", label: "Network", icon: FlaskConical },
  { id: "modules", label: "Modules", icon: Box },
  { id: "analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { id: "terminal", label: "Activity", icon: TerminalSquare },
  { id: "settings", label: "Settings", icon: Bell },
];

export const agentTypes: AgentTypeOption[] = [
  {
    id: "sovereign",
    title: "Sovereign Agent",
    tag: "Autonomous & Onchain",
    description: "Fully autonomous agent with onchain identity, wallet, and decision rights.",
  },
  {
    id: "persistent",
    title: "Persistent Agent",
    tag: "Long-Lived & Stateful",
    description: "Maintains long-term memory and context across sessions and epochs.",
  },
];

export const initialProfile: AgentProfile = {
  name: "Market Sentinel",
  symbol: "MSENT",
  description: "Monitors DeFi markets, detects anomalies, and executes protective actions onchain.",
  persona: "Analytical Guardian",
  voice: "Precise & Concise",
  storage: {
    memory: {
      platform: "hf",
      path: "builder/ragent-memory/market-sentinel/memory.jsonl",
      keyRef: "HF_TOKEN",
    },
    knowledge: {
      platform: "hf",
      path: "builder/ragent-memory/market-sentinel/knowledge.jsonl",
      keyRef: "HF_TOKEN",
    },
    output: {
      platform: "hf",
      path: "builder/ragent-memory/market-sentinel/outputs.jsonl",
      keyRef: "HF_TOKEN",
    },
    secrets: [
      { key: "LLM_PROVIDER", label: "Ritual gateway provider", encrypted: false, defaultValue: "ritual", sensitive: false },
      { key: "HF_TOKEN", label: "HuggingFace write token", encrypted: false },
    ],
  },
};

export const personaOptions = ["Analytical Guardian", "Risk Cartographer", "Protocol Steward", "Signal Hunter"];
export const voiceOptions = ["Precise & Concise", "Quietly Formal", "Incident Commander", "Research Memo"];

export const coreModules: CoreModule[] = [
  { id: "memory", title: "Memory", icon: BrainCircuit, lines: ["Vector + Episodic"], side: "left", position: "top" },
  { id: "knowledge", title: "Knowledge", icon: ClipboardList, lines: ["RAG + Onchain Data"], side: "left", position: "middle" },
  { id: "identity", title: "Identity", icon: Fingerprint, lines: ["Ritual ID", "0x8C...7A21"], side: "left", position: "bottom" },
  { id: "goals", title: "Goals", icon: Goal, lines: ["Autonomous", "Objective Engine"], side: "right", position: "top" },
  { id: "reasoning", title: "Reasoning", icon: Network, lines: ["Multi-Step", "Planning"], side: "right", position: "middle" },
  { id: "execution", title: "Execution", icon: Zap, lines: ["Onchain + Offchain", "Action Layer"], side: "right", position: "bottom" },
];

export const initialCapabilities: Capability[] = [
  { id: "llm", title: "LLM", description: "Large language model reasoning", enabled: true, icon: Sparkles },
  { id: "http", title: "HTTP", description: "Make HTTP(S) requests", enabled: true, icon: CircleDotDashed },
  { id: "scheduler", title: "Scheduler", description: "Time-based triggers & cron", enabled: true, icon: ClipboardList },
  { id: "memory", title: "Memory", description: "User-owned storage refs", enabled: true, icon: BrainCircuit },
  { id: "wallet", title: "Wallet", description: "Onchain wallet & transactions", enabled: true, icon: WalletCards },
  { id: "secrets", title: "Secrets", description: "Encrypted user credentials", enabled: true, icon: KeyRound },
  { id: "zkfhe", title: "ZK / FHE", description: "Zero-knowledge / FHE compute", enabled: false, icon: ShieldCheck },
  { id: "actions", title: "Actions", description: "Custom actions & plugins", enabled: true, icon: Workflow },
];

export const missionLines = [
  "You are Market Sentinel.",
  "Your mission is to continuously monitor DeFi markets,",
  "analyze signals and anomalies, and execute protective",
  "or opportunistic actions onchain.",
  "Always optimize for risk-adjusted outcomes and safety.",
];

export const agentTemplates: AgentTemplate[] = [
  { id: "market", name: "Market Sentinel", category: "DeFi", description: "Monitors market anomalies, price deviations, liquidity shifts, and executes protective actions.", tags: ["LLM", "HTTP", "Scheduler", "Wallet"], recommendedType: "sovereign", mission: "Continuously monitor DeFi markets and act only inside approved risk limits.", cost: "12.4 RITUAL/mo" },
  { id: "audit", name: "Contract Auditor", category: "Security", description: "Reviews smart contract behavior, detects risky patterns, and generates audit-style reports.", tags: ["LLM", "Memory", "Reports"], recommendedType: "persistent", mission: "Review contract behavior and produce a concise risk report after every scan.", cost: "18.9 RITUAL/mo" },
  { id: "wallet", name: "Wallet Guardian", category: "Security", description: "Watches wallet activity, flags suspicious transactions, and recommends protective actions.", tags: ["Wallet", "Secrets", "Scheduler"], recommendedType: "sovereign", mission: "Detect suspicious wallet activity and prepare protective responses before action.", cost: "9.7 RITUAL/mo" },
  { id: "research", name: "Research Oracle", category: "Research", description: "Collects web and onchain information, summarizes signals, and stores long-term research memory.", tags: ["LLM", "HTTP", "Memory"], recommendedType: "persistent", mission: "Collect research signals, summarize them, and maintain long-term notes.", cost: "21.3 RITUAL/mo" },
  { id: "gov", name: "Governance Watcher", category: "Governance", description: "Tracks proposals, votes, forum activity, and prepares decision briefings.", tags: ["HTTP", "Scheduler", "Memory"], recommendedType: "sovereign", mission: "Track governance events and prepare decision briefings for review.", cost: "8.2 RITUAL/mo" },
  { id: "yield", name: "Yield Scout", category: "DeFi", description: "Analyzes yield opportunities, risk levels, and capital movement across protocols.", tags: ["LLM", "HTTP", "Wallet"], recommendedType: "persistent", mission: "Analyze yield opportunities and rank them by risk-adjusted confidence.", cost: "22.3 RITUAL/mo" },
  { id: "news", name: "News Reactor", category: "Automation", description: "Reads relevant news, classifies urgency, and triggers workflows based on new events.", tags: ["HTTP", "LLM", "Actions"], recommendedType: "sovereign", mission: "Classify incoming news and trigger approved workflows for urgent events.", cost: "10.6 RITUAL/mo" },
  { id: "health", name: "Protocol Health Monitor", category: "Automation", description: "Checks uptime, contract events, API responses, and system reliability signals.", tags: ["HTTP", "Scheduler", "Reports"], recommendedType: "persistent", mission: "Monitor protocol health and report degraded service signals.", cost: "14.8 RITUAL/mo" },
];

export const integrations: IntegrationItem[] = [
  { id: "http-endpoint", section: "Data Sources", name: "HTTP Endpoint", description: "Read structured data from external endpoints.", status: "Connected", icon: Globe2 },
  { id: "price-feed", section: "Data Sources", name: "Price Feed", description: "Structured market streams for agent triggers.", status: "Available", icon: Activity },
  { id: "events", section: "Data Sources", name: "Onchain Events", description: "Watch contract events and decoded traces.", status: "Connected", icon: GitBranch },
  { id: "rss", section: "Data Sources", name: "RSS / News Feed", description: "Classify news and market reports.", status: "Available", icon: FileText },
  { id: "webhook", section: "Data Sources", name: "Custom Webhook", description: "Receive app-specific signals.", status: "Experimental", icon: PlugZap },
  { id: "llm-runtime", section: "Agent Capabilities", name: "LLM Runtime", description: "Reasoning module for agent planning.", status: "Connected", icon: BrainCircuit },
  { id: "scheduler", section: "Agent Capabilities", name: "Scheduler", description: "Time-based execution cycles.", status: "Connected", icon: Timer },
  { id: "memory-store", section: "Agent Capabilities", name: "Memory Store", description: "User-owned DA storage references.", status: "Available", icon: Database },
  { id: "secrets-vault", section: "Agent Capabilities", name: "Secrets Vault", description: "Encrypted user credentials.", status: "Available", icon: Lock },
  { id: "zk-fhe", section: "Agent Capabilities", name: "ZK / FHE Compute", description: "Private computation modules.", status: "Experimental", icon: ShieldCheck },
  { id: "actions", section: "Agent Capabilities", name: "Action Plugins", description: "Approved tools and custom actions.", status: "Available", icon: Workflow },
  { id: "ritual-testnet", section: "Execution Targets", name: "Ritual Testnet", description: "Configured chain target for deployment preview.", status: "Connected", icon: Rocket },
  { id: "evm-wallet", section: "Execution Targets", name: "EVM Wallet", description: "Wallet policy execution preview.", status: "Available", icon: WalletCards },
  { id: "callback", section: "Execution Targets", name: "Smart Contract Callback", description: "Async delivery target preview.", status: "Available", icon: Code2 },
  { id: "external-webhook", section: "Execution Targets", name: "External Webhook", description: "Notify external systems after settlement.", status: "Disabled", icon: Cloud },
  { id: "fork", section: "Execution Targets", name: "Testnet Fork", description: "Isolated execution review environment.", status: "Connected", icon: FlaskConical },
];

export const moduleLibrary: ModuleItem[] = [
  { id: "llm", name: "LLM", description: "Large language model reasoning.", status: "Enabled", category: "Core", icon: BrainCircuit },
  { id: "http", name: "HTTP", description: "Fetch external data sources.", status: "Enabled", category: "Data", icon: Globe2 },
  { id: "scheduler", name: "Scheduler", description: "Delayed and recurring execution.", status: "Enabled", category: "Execution", icon: Timer },
  { id: "memory", name: "Memory", description: "Long-term user-owned storage refs.", status: "Enabled", category: "Core", icon: Database },
  { id: "wallet", name: "Wallet", description: "Wallet action policy preview.", status: "Enabled", category: "Execution", icon: WalletCards },
  { id: "secrets", name: "Secrets", description: "Encrypted credential handoff.", status: "Available", category: "Safety", icon: KeyRound },
  { id: "zk", name: "ZK / FHE", description: "Private compute experiments.", status: "Experimental", category: "Experimental", icon: ShieldCheck },
  { id: "actions", name: "Actions", description: "Custom action allowlists.", status: "Available", category: "Execution", icon: Workflow },
  { id: "risk", name: "Risk Guard", description: "Budget and action circuit breaker.", status: "Available", category: "Safety", icon: AlertTriangle },
  { id: "rate", name: "Rate Limiter", description: "Throttle recurring execution.", status: "Available", category: "Safety", icon: Gauge },
  { id: "listener", name: "Event Listener", description: "Watch decoded onchain events.", status: "Available", category: "Data", icon: Radio },
  { id: "report", name: "Report Generator", description: "Create markdown execution summaries.", status: "Available", category: "Core", icon: FileText },
];

export const docsSections: DocSection[] = [
  { id: "overview", title: "Overview", body: "RAgent helps builders design autonomous agents with identity, memory, reasoning, scheduling, and execution layers." },
  { id: "sovereign", title: "Sovereign Agents", body: "Sovereign Agents are contract-native agents that wake up, reason, act, and return to sleep through scheduled execution cycles." },
  { id: "persistent", title: "Persistent Agents", body: "Persistent Agents are long-lived stateful agents designed for continuous operation, memory retention, heartbeats, and recovery flows." },
  { id: "capabilities", title: "Capabilities", body: "Capabilities define what an agent can access: LLM reasoning, HTTP requests, memory, wallet execution, secrets, ZK/FHE, and custom actions." },
  { id: "scheduler", title: "Scheduler", body: "The Scheduler allows agents to execute at future intervals or in response to predicate-based conditions." },
  { id: "preflight", title: "Preflight", body: "Preflight checks wallet state, executor availability, storage credentials, sender lock, funding, and secret access before launch." },
  { id: "deployment", title: "Deployment", body: "Deployment packages the agent profile, capabilities, mission, and execution settings into a Ritual-ready configuration." },
  { id: "safety", title: "Safety Model", body: "Agents should be constrained by permissions, spending limits, action allowlists, and explicit confirmation workflows." },
];

export const createOptions = [
  { id: "agent", title: "New Agent", description: "Reset Foundry and begin a new mandate.", icon: Bot },
];
