import { Plus, Rocket } from "lucide-react";
import { useState } from "react";
import type { AgentProfile, Capability, StorageValidationResult } from "../types";
import { GlassCard } from "./GlassCard";
import { GlowButton } from "./GlowButton";
import { ModalShell } from "./ModalShell";
import { SectionHeader } from "./SectionHeader";
import { CapabilityToggle } from "./CapabilityToggle";
import { ExecutorStatusCard } from "./ExecutorStatusCard";
import { RitualWalletCard } from "./RitualWalletCard";
import { SecretEncryptionPanel } from "./SecretEncryptionPanel";
import { AsyncJobsCard } from "./AsyncJobsCard";
import type { SignedSecretBundle } from "../types";

interface CapabilitiesPanelProps {
  capabilities: Capability[];
  profile: AgentProfile;
  onToggle: (id: string) => void;
  onAddCapability: (title: string, description: string) => void;
  onDeploy: () => void;
  onSecretBundleChange: (bundle: SignedSecretBundle | null) => void;
  onStorageValidationChange: (results: StorageValidationResult[]) => void;
}

export function CapabilitiesPanel({ capabilities, profile, onToggle, onAddCapability, onDeploy, onSecretBundleChange, onStorageValidationChange }: CapabilitiesPanelProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  function saveCustomCapability() {
    const title = customTitle.trim();
    if (!title) return;
    onAddCapability(title, customDescription.trim() || "Custom user-defined agent capability.");
    setCustomTitle("");
    setCustomDescription("");
    setCustomOpen(false);
  }

  return (
    <>
      <GlassCard className="flex min-w-0 flex-col overflow-hidden xl:col-start-3 xl:row-start-1 xl:row-span-2 xl:h-full xl:min-h-0">
        <div className="shrink-0 p-4 pb-3">
          <GlowButton onClick={onDeploy} className="h-14 w-full text-base">
            <Rocket className="h-5 w-5" />
            Deploy to Ritual
          </GlowButton>
        </div>

        <div className="min-w-0 px-4 pb-4 pr-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overflow-x-hidden">
          <div>
            <SectionHeader number="3" title="Capabilities" subtitle="Enable modules to expand your agent's abilities." />
          </div>

          <div className="mt-5 grid gap-2">
            {capabilities.map((capability) => (
              <CapabilityToggle key={capability.id} capability={capability} onToggle={onToggle} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-300/14 bg-slate-950/35 text-sm font-semibold text-blue-100 transition hover:border-blue-300/35"
          >
            <Plus className="h-4 w-4" />
            Add Custom Capability
          </button>

          <div className="mt-4 grid gap-3">
            <ExecutorStatusCard />
            <SecretEncryptionPanel
              secrets={profile.storage.secrets}
              storageRefs={[profile.storage.memory, profile.storage.output]}
              onBundleChange={onSecretBundleChange}
              onStorageValidationChange={onStorageValidationChange}
            />
            <RitualWalletCard />
            <AsyncJobsCard />
          </div>
        </div>
      </GlassCard>

      <ModalShell open={customOpen} title="Custom Capability" subtitle="Add a local capability to this agent blueprint." onClose={() => setCustomOpen(false)}>
        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs text-slate-400">Name</span>
            <input className="input" value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="Risk Guard" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs text-slate-400">Description</span>
            <textarea className="input min-h-24" value={customDescription} onChange={(event) => setCustomDescription(event.target.value)} placeholder="Describe what this capability allows the agent to do." />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCustomOpen(false)} className="small-action">Cancel</button>
            <button type="button" onClick={saveCustomCapability} disabled={!customTitle.trim()} className="small-action disabled:cursor-not-allowed disabled:opacity-50">
              Add Capability
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
