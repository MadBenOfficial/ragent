import { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, LockKeyhole, Rocket, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { parseEther, type Address } from "viem";
import { RITUAL_AGENT_FACTORIES, RITUAL_CHAIN, storagePlatformLabels } from "../lib/ritual";
import { truncateHex } from "../lib/secrets";
import { formatRitualAmount } from "../lib/agentLaunch";
import { useAgentLaunchPlan } from "../hooks/useAgentLaunchPlan";
import { useRAgentController } from "../hooks/useRAgentController";
import { useSecretAccessStatus, useSecretsAccess } from "../hooks/useSecretsAccess";
import { usePersistentLaunch } from "../hooks/usePersistentLaunch";
import { useSovereignLaunch } from "../hooks/useSovereignLaunch";
import type { AgentProfile, AgentTypeId, Capability, IntegrationConfig, LaunchPreflightItem, SignedSecretBundle, StorageValidationResult } from "../types";
import { GlowButton } from "./GlowButton";

interface DeployModalProps {
  open: boolean;
  onClose: () => void;
  onNotify: (message: string) => void;
  profile: AgentProfile;
  agentTypeId: AgentTypeId;
  agentTypeLabel: string;
  network: string;
  secretBundle: SignedSecretBundle | null;
  storageChecks: StorageValidationResult[];
  integrationConfigs: Record<string, IntegrationConfig>;
  capabilities: Capability[];
  requireLaunchConfirmation?: boolean;
}

export function DeployModal({
  open,
  onClose,
  onNotify,
  profile,
  agentTypeId,
  agentTypeLabel,
  network,
  secretBundle,
  storageChecks,
  integrationConfigs,
  capabilities,
  requireLaunchConfirmation = true,
}: DeployModalProps) {
  const factoryAddress = agentTypeId === "sovereign" ? RITUAL_AGENT_FACTORIES.sovereign : RITUAL_AGENT_FACTORIES.persistent;
  const [dkmsFundingInput, setDkmsFundingInput] = useState("0");
  const [schedulerFundingInput, setSchedulerFundingInput] = useState("0");
  const [confirmLiveLaunch, setConfirmLiveLaunch] = useState(false);
  const launchConfirmed = confirmLiveLaunch || !requireLaunchConfirmation;
  const dkmsFunding = useMemo(() => parseRitualInput(dkmsFundingInput), [dkmsFundingInput]);
  const schedulerFunding = useMemo(() => parseRitualInput(schedulerFundingInput), [schedulerFundingInput]);
  const controller = useRAgentController({
    profile,
    agentType: agentTypeId,
    secretsHash: secretBundle?.secretsHash,
  });
  const launchPlan = useAgentLaunchPlan({
    profile,
    agentType: agentTypeId,
    capabilities,
    userSalt: controller.prepared.userSalt,
    secretBundle,
    storageChecks,
    integrationConfigs,
    dkmsFunding,
    schedulerFunding,
  });
  const delegateAddress = (launchPlan.kind === "sovereign" ? launchPlan.predictedChild : launchPlan.predictedLauncher) as Address | undefined;
  const secretAccess = useSecretAccessStatus(delegateAddress, secretBundle?.secretsHash);
  const secretAccessReady = !!secretBundle && !!delegateAddress && secretAccess.hasAccess;
  const secretsAccess = useSecretsAccess();
  const sovereignLaunch = useSovereignLaunch();
  const persistentLaunch = usePersistentLaunch();

  async function registerPreparedAgent() {
    try {
      const txHash = await controller.registerAgent();
      onNotify(`Registration submitted: ${truncateHex(txHash, 10, 8)}`);
      onClose();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Could not register agent.");
    }
  }

  async function grantSecretAccess() {
    try {
      if (!delegateAddress) throw new Error("Connect wallet to predict the delegate contract first.");
      if (!secretBundle) throw new Error("Encrypt secrets before granting access.");
      const txHash = await secretsAccess.grantAccess(delegateAddress, secretBundle.secretsHash);
      onNotify(`Secret access submitted: ${truncateHex(txHash, 10, 8)}`);
      void secretAccess.refetch();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Could not grant secret access.");
    }
  }

  async function launchSovereignAgent() {
    try {
      if (launchPlan.kind !== "sovereign") throw new Error("Persistent launch is still locked.");
      if (!launchConfirmed) throw new Error("Confirm live launch before sending.");
      const txHash = await sovereignLaunch.launch(launchPlan, {
        agentName: profile.name,
        agentId: controller.prepared.agentId,
      });
      onNotify(`Sovereign launch submitted: ${truncateHex(txHash, 10, 8)}`);
      onClose();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Could not launch Sovereign agent.");
    }
  }

  async function launchPersistentAgent() {
    try {
      if (launchPlan.kind !== "persistent") throw new Error("Sovereign launch is selected.");
      if (!launchConfirmed) throw new Error("Confirm live launch before sending.");
      const txHash = await persistentLaunch.launch(launchPlan, {
        agentName: profile.name,
        agentId: controller.prepared.agentId,
      });
      onNotify(`Persistent launch submitted: ${truncateHex(txHash, 10, 8)}`);
      onClose();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Could not launch Persistent agent.");
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-black/70 p-3 backdrop-blur-md sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Deploy Agent to Ritual"
        >
          <motion.div
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-lg border border-blue-300/18 bg-[#071023] p-5 shadow-neon-violet sm:max-h-[calc(100dvh-2rem)]"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-blue-300/20 bg-ritual-blue/10 text-blue-100">
                  <Rocket className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-50">Prepare Ritual Agent</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Metadata can be registered now. Live factory launch stays locked until you explicitly fund it.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close deploy preview"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-2 rounded-lg border border-blue-300/12 bg-slate-950/42 p-4 text-sm">
              <Row label="Agent" value={profile.name} />
              <Row label="Type" value={agentTypeLabel} />
              <Row label="Network" value={network} />
              <Row label="Chain ID" value={String(RITUAL_CHAIN.id)} />
              <Row label="Controller" value={controller.controllerAddress ?? "not deployed"} muted={!controller.controllerAddress} />
              <Row label="Factory" value={factoryAddress} />
              <Row label="Agent ID" value={controller.prepared.agentId ?? "connect wallet after deploy"} muted={!controller.prepared.agentId} />
              <Row
                label={launchPlan.kind === "sovereign" ? "Harness" : "Launcher"}
                value={(launchPlan.kind === "sovereign" ? launchPlan.predictedChild : launchPlan.predictedLauncher) ?? "connect wallet to predict"}
                muted={launchPlan.kind === "sovereign" ? !launchPlan.predictedChild : !launchPlan.predictedLauncher}
              />
              <Row label="Memory" value={storagePlatformLabels[profile.storage.memory.platform]} />
              <Row label="Memory Ref" value={profile.storage.memory.path} />
              <Row label="Output Ref" value={profile.storage.output.path} />
              <Row label="Secrets Hash" value={secretBundle?.secretsHash ?? "not encrypted"} muted={!secretBundle} />
            </div>

            {launchPlan.kind === "sovereign" ? (
              <div className="mt-3 grid gap-2 rounded-lg border border-blue-300/12 bg-slate-950/42 p-4 text-sm">
                <Row label="Runtime" value={`${launchPlan.cliLabel} / ${launchPlan.model}`} />
                <Row label="Executor" value={launchPlan.executor ?? "executor pending"} muted={!launchPlan.executor} />
                <Row label="Frequency" value={`${launchPlan.schedule.frequency} blocks`} />
                <Row label="Window" value={`${launchPlan.windowNumCalls} calls`} />
                <Row label="DKMS Funding" value={formatRitualAmount(launchPlan.dkmsFunding)} />
                <Row label="Scheduler Funding" value={formatRitualAmount(launchPlan.schedulerFunding)} />
                <Row label="Total Funding" value={formatRitualAmount(launchPlan.totalFunding)} />
              </div>
            ) : (
              <div className="mt-3 grid gap-2 rounded-lg border border-blue-300/12 bg-slate-950/42 p-4 text-sm">
                <Row label="Runtime" value={`${launchPlan.providerLabel ?? "external LLM"} / ${launchPlan.model ?? "provider model"}`} />
                <Row label="Executor" value={launchPlan.executor ?? "executor pending"} muted={!launchPlan.executor} />
                <Row label="Launcher" value={launchPlan.predictedLauncher ?? "connect wallet to predict"} muted={!launchPlan.predictedLauncher} />
                <Row label="LLM KeyRef" value={launchPlan.llmApiKeyRef ?? "missing external provider key"} muted={!launchPlan.llmApiKeyRef} />
                <Row label="DKMS Funding" value={formatRitualAmount(launchPlan.dkmsFunding)} />
                <Row label="Scheduler Funding" value={formatRitualAmount(launchPlan.schedulerFunding)} />
                <Row label="Total Funding" value={formatRitualAmount(launchPlan.totalFunding)} />
              </div>
            )}

            <div className="mt-3 grid gap-2">
              <ReadinessRow
                ready={controller.isControllerConfigured}
                title="Controller address"
                detail={controller.isControllerConfigured ? "VITE_RAGENT_CONTROLLER is configured." : "Deploy the controller later, then set VITE_RAGENT_CONTROLLER."}
              />
              <ReadinessRow
                ready={secretAccessReady}
                title="Secret delegate access"
                detail={
                  secretAccess.hasAccess
                    ? "SecretsAccessControl allows this predicted contract."
                    : "Grant access after secrets are encrypted and the child address is predicted."
                }
              />
              {launchPlan.preflight.map((item) => (
                <PreflightRow key={item.id} item={item} />
              ))}
            </div>

            {launchPlan.kind === "sovereign" || launchPlan.kind === "persistent" ? (
              <div className="mt-3 grid gap-3 rounded-lg border border-blue-300/12 bg-slate-950/42 p-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-medium text-slate-400">DKMS Funding</span>
                    <input
                      className="input font-mono text-xs"
                      value={dkmsFundingInput}
                      onChange={(event) => setDkmsFundingInput(event.target.value)}
                      inputMode="decimal"
                      placeholder="0"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-medium text-slate-400">Scheduler Funding</span>
                    <input
                      className="input font-mono text-xs"
                      value={schedulerFundingInput}
                      onChange={(event) => setSchedulerFundingInput(event.target.value)}
                      inputMode="decimal"
                      placeholder="0"
                    />
                  </label>
                </div>
                {requireLaunchConfirmation ? (
                  <label className="flex items-start gap-2 text-xs text-slate-400">
                    <input
                      className="mt-0.5"
                      type="checkbox"
                      checked={confirmLiveLaunch}
                      onChange={(event) => setConfirmLiveLaunch(event.target.checked)}
                    />
                    <span>I understand this sends a live factory transaction and spends the funding above.</span>
                  </label>
                ) : (
                  <p className="text-xs text-slate-500">Launch confirmation is disabled in Settings; the live launch button is unlocked.</p>
                )}
                <p className="text-xs text-slate-500">
                  After wallet submission, RAgent stores non-secret launch metadata locally and reconciles live Ritual job events.
                </p>
              </div>
            ) : null}

            <div className="mt-3 flex gap-3 rounded-lg border border-blue-300/10 bg-slate-950/35 p-3 text-xs text-slate-400">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-ritual-gold" />
              <p>{launchPlan.lockReason}</p>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-blue-300/14 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-blue-300/35"
              >
                Cancel
              </button>
              <button
                onClick={() => void grantSecretAccess()}
                disabled={!delegateAddress || !secretBundle || secretAccess.hasAccess || secretsAccess.isPending}
                className="rounded-lg border border-blue-300/14 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:border-blue-300/35 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {secretsAccess.isPending ? "Granting" : secretAccess.hasAccess ? "Access Granted" : "Grant Secrets"}
              </button>
              <GlowButton
                onClick={() => void registerPreparedAgent()}
                disabled={!controller.isControllerConfigured || !controller.isConnected || controller.isPending}
              >
                {controller.isPending
                  ? "Submitting"
                  : !controller.isControllerConfigured
                    ? "Controller Pending"
                    : !controller.isConnected
                      ? "Connect Wallet Later"
                      : "Register Agent"}
              </GlowButton>
              <GlowButton
                onClick={() => void launchSovereignAgent()}
                disabled={
                  launchPlan.kind !== "sovereign" ||
                  launchPlan.liveLaunchLocked ||
                  !secretAccessReady ||
                  !launchConfirmed ||
                  sovereignLaunch.isPending
                }
              >
                {sovereignLaunch.isPending ? "Launching" : "Launch Sovereign"}
              </GlowButton>
              <GlowButton
                onClick={() => void launchPersistentAgent()}
                disabled={
                  launchPlan.kind !== "persistent" ||
                  launchPlan.liveLaunchLocked ||
                  !secretAccessReady ||
                  !launchConfirmed ||
                  persistentLaunch.isPending
                }
              >
                {persistentLaunch.isPending ? "Launching" : "Launch Persistent"}
              </GlowButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function parseRitualInput(value: string) {
  try {
    const normalized = value.trim();
    if (!normalized || Number(normalized) <= 0) return 0n;
    return parseEther(normalized);
  } catch {
    return 0n;
  }
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={`max-w-[320px] truncate text-right font-mono ${muted ? "text-slate-500" : "text-slate-200"}`}>{value}</span>
    </div>
  );
}

function ReadinessRow({ ready, title, detail }: { ready: boolean; title: string; detail: string }) {
  const Icon = ready ? CheckCircle2 : CircleAlert;
  return (
    <div className="flex gap-3 rounded-lg border border-blue-300/10 bg-slate-950/35 p-3">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ready ? "text-ritual-green" : "text-ritual-gold"}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function PreflightRow({ item }: { item: LaunchPreflightItem }) {
  const Icon = item.ready ? CheckCircle2 : CircleAlert;
  const color = item.ready ? "text-ritual-green" : item.severity === "block" ? "text-ritual-gold" : "text-blue-200";

  return (
    <div className="flex gap-3 rounded-lg border border-blue-300/10 bg-slate-950/35 p-3">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-200">{item.label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
      </div>
    </div>
  );
}
