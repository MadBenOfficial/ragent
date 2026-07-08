import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Workflow } from "lucide-react";
import { AppShell } from "./components/AppShell";
import { BottomStatusBar } from "./components/BottomStatusBar";
import { DeployModal } from "./components/DeployModal";
import { LeftRail } from "./components/LeftRail";
import { Toast } from "./components/Toast";
import { TopBar, type TopBarAction } from "./components/TopBar";
import { FoundryView } from "./views/FoundryView";
import { AgentsView } from "./views/AgentsView";
import { TemplatesView } from "./views/TemplatesView";
import { IntegrationsView } from "./views/IntegrationsView";
import { DocsView } from "./views/DocsView";
import { ToolPanels } from "./components/ToolPanels";
import { AgentDetailsModal } from "./components/AgentDetailsModal";
import { TemplatePreviewModal } from "./components/TemplatePreviewModal";
import { IntegrationConfigModal } from "./components/IntegrationConfigModal";
import { appMeta, initialCapabilities, initialProfile } from "./data/seedData";
import { loadIntegrationConfigs, saveIntegrationConfig } from "./lib/integrationStore";
import { loadSettings } from "./lib/settingsStore";
import { useWorkspaceSettings } from "./hooks/useWorkspaceSettings";
import { RITUAL_CHAIN } from "./lib/ritual";
import type {
  AgentProfile,
  AgentTemplate,
  AgentTypeId,
  Capability,
  ControllerStorageRef,
  IntegrationConfig,
  IntegrationItem,
  ModuleItem,
  RailToolId,
  RegisteredAgent,
  SignedSecretBundle,
  StoragePlatform,
  StorageRef,
  StorageValidationResult,
  TopNavId,
} from "./types";

const MODULE_CAPABILITY_ALIAS: Record<string, string> = { zk: "zkfhe" };

function moduleCapabilityId(moduleId: string) {
  return MODULE_CAPABILITY_ALIAS[moduleId] ?? moduleId;
}

export default function App() {
  const { settings, update: updateSetting, reset: resetSettings } = useWorkspaceSettings();
  const [agentType, setAgentType] = useState<AgentTypeId>(() => loadSettings().defaultAgentType);
  const [profile, setProfile] = useState<AgentProfile>(() => ({
    ...initialProfile,
    voice: loadSettings().defaultVoice,
  }));
  const [capabilities, setCapabilities] = useState<Capability[]>(initialCapabilities);
  const [deployOpen, setDeployOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTopNav, setActiveTopNav] = useState<TopNavId>("foundry");
  const [activeTool, setActiveTool] = useState<RailToolId | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<RegisteredAgent | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null);
  const [integrationConfigs, setIntegrationConfigs] = useState<Record<string, IntegrationConfig>>(() => loadIntegrationConfigs());
  const [secretBundle, setSecretBundle] = useState<SignedSecretBundle | null>(null);
  const [storageChecks, setStorageChecks] = useState<StorageValidationResult[]>([]);

  const selectedTypeLabel = useMemo(
    () => (agentType === "sovereign" ? "Sovereign Agent" : "Persistent Agent"),
    [agentType],
  );

  function toggleCapability(id: string) {
    setCapabilities((items) => items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  }

  function toggleModule(module: ModuleItem) {
    const capabilityId = moduleCapabilityId(module.id);
    let nextEnabled = false;
    setCapabilities((items) => {
      const existing = items.find((item) => item.id === capabilityId);
      if (existing) {
        nextEnabled = !existing.enabled;
        return items.map((item) => (item.id === capabilityId ? { ...item, enabled: nextEnabled } : item));
      }
      nextEnabled = true;
      return [
        ...items,
        {
          id: capabilityId,
          title: module.name,
          description: module.description,
          enabled: true,
          icon: module.icon,
        },
      ];
    });
    showToast(`${module.name} ${nextEnabled ? "enabled" : "disabled"} for this agent.`);
  }

  function addCapability(title: string, description: string) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 36) || "custom";
    setCapabilities((items) => [
      ...items,
      {
        id: `custom-${slug}-${items.length + 1}`,
        title,
        description,
        enabled: true,
        icon: Workflow,
      },
    ]);
    showToast("Custom capability added.");
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  function newAgent() {
    setProfile({ ...initialProfile, voice: settings.defaultVoice });
    setAgentType(settings.defaultAgentType);
    setCapabilities(initialCapabilities);
    setSecretBundle(null);
    setStorageChecks([]);
    setActiveTopNav("foundry");
    showToast("New agent created.");
  }

  function useTemplate(template: AgentTemplate) {
    setProfile({
      name: template.name,
      symbol: template.name.split(" ").map((part) => part[0]).join("").slice(0, 5).toUpperCase(),
      description: template.description,
      persona: template.category === "Security" ? "Protocol Steward" : "Analytical Guardian",
      voice: "Precise & Concise",
      storage: {
        ...initialProfile.storage,
        memory: {
          ...initialProfile.storage.memory,
          path: `builder/ragent-memory/${template.id}/memory.jsonl`,
        },
        knowledge: {
          ...initialProfile.storage.knowledge,
          path: `builder/ragent-memory/${template.id}/knowledge.jsonl`,
        },
        output: {
          ...initialProfile.storage.output,
          path: `builder/ragent-memory/${template.id}/outputs.jsonl`,
        },
      },
    });
    setAgentType(template.recommendedType);
    setSecretBundle(null);
    setStorageChecks([]);
    setSelectedTemplate(null);
    setActiveTopNav("foundry");
    showToast("Template loaded into Foundry.");
  }

  function loadRegisteredAgent(agent: RegisteredAgent, options?: { openDeploy?: boolean }) {
    setProfile((current) => ({
      name: agent.name,
      symbol: agent.symbol,
      description: current.description || `Registered ${agent.agentType} agent loaded from RAgentController.`,
      persona: current.persona,
      voice: current.voice,
      storage: {
        ...current.storage,
        memory: toEditableStorageRef(agent.memoryRef, current.storage.memory),
        output: toEditableStorageRef(agent.outputRef, current.storage.output),
      },
    }));
    setAgentType(agent.agentType);
    setSecretBundle(null);
    setStorageChecks([]);
    setSelectedAgent(null);
    setActiveTopNav("foundry");
    setDeployOpen(options?.openDeploy ?? false);
    showToast(options?.openDeploy ? "Agent loaded into deploy flow." : "Agent loaded into Foundry.");
  }

  function openAgentLogs(agent: RegisteredAgent) {
    if (!agent.txHash) {
      showToast("This agent was loaded from the controller index; no registration tx hash is attached.");
      return;
    }
    window.open(`${RITUAL_CHAIN.explorerUrl}/tx/${agent.txHash}`, "_blank", "noopener,noreferrer");
  }

  function handleTopBarAction(action: TopBarAction) {
    if (action === "explorer") {
      window.open(RITUAL_CHAIN.explorerUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (action === "activity") {
      setActiveTool("terminal");
      return;
    }
    if (action === "docs") {
      setActiveTopNav("docs");
      return;
    }
    setActiveTool("analytics");
  }

  function renderActiveView() {
    if (activeTopNav === "agents") {
      return <AgentsView onOpenAgent={setSelectedAgent} onOpenLogs={openAgentLogs} />;
    }
    if (activeTopNav === "templates") {
      return <TemplatesView onUseTemplate={useTemplate} onPreview={setSelectedTemplate} />;
    }
    if (activeTopNav === "integrations") {
      return <IntegrationsView configs={integrationConfigs} onConfigure={setSelectedIntegration} />;
    }
    if (activeTopNav === "docs") {
      return <DocsView />;
    }
    return (
      <FoundryView
        agentType={agentType}
        setAgentType={setAgentType}
        profile={profile}
        setProfile={setProfile}
        capabilities={capabilities}
        toggleCapability={toggleCapability}
        addCapability={addCapability}
        onDeploy={() => setDeployOpen(true)}
        onSecretBundleChange={(bundle) => {
          setSecretBundle(bundle);
          setStorageChecks(bundle?.storageChecks ?? []);
        }}
        onStorageValidationChange={setStorageChecks}
      />
    );
  }

  return (
    <AppShell>
      <TopBar activeNav={activeTopNav} onNavChange={setActiveTopNav} onUtilityAction={handleTopBarAction} />
      <LeftRail activeTool={activeTool} onSelect={setActiveTool} />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTopNav}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28 }}
          className="contents"
        >
          {renderActiveView()}
        </motion.div>
      </AnimatePresence>
      <BottomStatusBar profile={profile} agentType={agentType} secretBundle={secretBundle} />
      <DeployModal
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        onNotify={showToast}
        profile={profile}
        agentTypeId={agentType}
        agentTypeLabel={selectedTypeLabel}
        network={appMeta.network}
        secretBundle={secretBundle}
        storageChecks={storageChecks}
        integrationConfigs={integrationConfigs}
        capabilities={capabilities}
        requireLaunchConfirmation={settings.confirmBeforeLaunch}
      />
      <ToolPanels
        activeTool={activeTool}
        onClose={() => setActiveTool(null)}
        onNewAgent={newAgent}
        onNotify={showToast}
        capabilities={capabilities}
        onToggleModule={toggleModule}
        settings={settings}
        onUpdateSetting={updateSetting}
        onResetSettings={resetSettings}
      />
      <AgentDetailsModal
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        onEdit={loadRegisteredAgent}
        onLaunch={(agent) => loadRegisteredAgent(agent, { openDeploy: true })}
      />
      <TemplatePreviewModal template={selectedTemplate} onClose={() => setSelectedTemplate(null)} onUse={useTemplate} />
      <IntegrationConfigModal
        integration={selectedIntegration}
        config={selectedIntegration ? integrationConfigs[selectedIntegration.id] : undefined}
        onClose={() => setSelectedIntegration(null)}
        onSave={(config) => {
          setIntegrationConfigs(saveIntegrationConfig(config));
          setSelectedIntegration(null);
          showToast("Integration settings saved.");
        }}
      />
      <Toast message={toast} />
    </AppShell>
  );
}

function toEditableStorageRef(ref: ControllerStorageRef | undefined, fallback: StorageRef): StorageRef {
  if (!ref) return fallback;
  return {
    platform: isStoragePlatform(ref.platform) ? ref.platform : fallback.platform,
    path: ref.path,
    keyRef: ref.keyRef,
  };
}

function isStoragePlatform(value: string): value is StoragePlatform {
  return value === "hf" || value === "gcs" || value === "pinata" || value === "inline";
}
