import { AgentCore } from "../components/AgentCore";
import { AgentProfileForm } from "../components/AgentProfileForm";
import { AgentTypePanel } from "../components/AgentTypePanel";
import { CapabilitiesPanel } from "../components/CapabilitiesPanel";
import { MissionEditor } from "../components/MissionEditor";
import type { AgentProfile, AgentTypeId, Capability, SignedSecretBundle, StorageValidationResult } from "../types";

interface FoundryViewProps {
  agentType: AgentTypeId;
  setAgentType: (agentType: AgentTypeId) => void;
  profile: AgentProfile;
  setProfile: (profile: AgentProfile) => void;
  capabilities: Capability[];
  toggleCapability: (id: string) => void;
  addCapability: (title: string, description: string) => void;
  onDeploy: () => void;
  onSecretBundleChange: (bundle: SignedSecretBundle | null) => void;
  onStorageValidationChange: (results: StorageValidationResult[]) => void;
}

export function FoundryView({
  agentType,
  setAgentType,
  profile,
  setProfile,
  capabilities,
  toggleCapability,
  addCapability,
  onDeploy,
  onSecretBundleChange,
  onStorageValidationChange,
}: FoundryViewProps) {
  return (
    <main className="relative grid min-h-dvh min-w-0 flex-1 grid-cols-1 gap-3 overflow-visible p-3 pb-24 pl-[76px] pt-[78px] xl:fixed xl:inset-0 xl:z-10 xl:min-h-0 xl:content-start xl:overflow-hidden xl:pb-24 xl:pl-[82px] xl:grid-cols-[280px_minmax(540px,1fr)_300px] xl:grid-rows-[auto_minmax(0,1fr)] 2xl:grid-cols-[330px_minmax(720px,1fr)_370px]">
      <section className="h-[calc(100dvh-10.875rem)] min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 xl:col-start-1 xl:row-start-1 xl:row-span-2">
        <div className="grid min-h-max content-start gap-3 pb-3">
          <AgentTypePanel selected={agentType} onSelect={setAgentType} />
          <AgentProfileForm profile={profile} onChange={setProfile} />
        </div>
      </section>

      <CapabilitiesPanel
        profile={profile}
        capabilities={capabilities}
        onToggle={toggleCapability}
        onAddCapability={addCapability}
        onDeploy={onDeploy}
        onSecretBundleChange={onSecretBundleChange}
        onStorageValidationChange={onStorageValidationChange}
      />

      <AgentCore agentType={agentType} profile={profile} capabilities={capabilities} />

      <section className="grid min-h-0 gap-3 xl:col-start-2 xl:col-end-3 xl:row-start-2 xl:self-start">
        <MissionEditor
          profileName={profile.name}
          mission={profile.description}
          onMissionChange={(mission) => setProfile({ ...profile, description: mission })}
        />
      </section>
    </main>
  );
}
