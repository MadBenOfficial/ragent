import { Database, Edit3, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { personaOptions, voiceOptions } from "../data/seedData";
import { DEFAULT_STORAGE_KEY_REFS, storagePlatformLabels } from "../lib/ritual";
import type { AgentProfile, SecretRef, StoragePlatform, StorageRef } from "../types";
import { GlassCard } from "./GlassCard";

interface AgentProfileFormProps {
  profile: AgentProfile;
  onChange: (profile: AgentProfile) => void;
}

export function AgentProfileForm({ profile, onChange }: AgentProfileFormProps) {
  function update<K extends keyof AgentProfile>(key: K, value: AgentProfile[K]) {
    onChange({ ...profile, [key]: value });
  }

  function updateMemory<K extends keyof StorageRef>(key: K, value: StorageRef[K]) {
    const nextMemory = { ...profile.storage.memory, [key]: value };

    if (key === "platform") {
      const platform = value as StoragePlatform;
      nextMemory.keyRef = platform === "inline" ? "" : DEFAULT_STORAGE_KEY_REFS[platform];
    }

    onChange({
      ...profile,
      storage: {
        ...profile.storage,
        memory: nextMemory,
        secrets: ensureStorageSecret(profile.storage.secrets, nextMemory),
      },
    });
  }

  function updateOutput<K extends keyof StorageRef>(key: K, value: StorageRef[K]) {
    const nextOutput = { ...profile.storage.output, [key]: value };

    if (key === "platform") {
      const platform = value as StoragePlatform;
      nextOutput.keyRef = platform === "inline" ? "" : DEFAULT_STORAGE_KEY_REFS[platform];
    }

    onChange({
      ...profile,
      storage: {
        ...profile.storage,
        output: nextOutput,
        secrets: ensureStorageSecret(profile.storage.secrets, nextOutput),
      },
    });
  }

  return (
    <GlassCard className="p-4">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">Agent Profile</h2>
        <Edit3 className="h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-4 pr-1">
        <div className="grid gap-3">
          <Field label="Name">
            <input value={profile.name} onChange={(event) => update("name", event.target.value)} className="input" />
          </Field>
          <Field label="Symbol">
            <input value={profile.symbol} onChange={(event) => update("symbol", event.target.value)} className="input" />
          </Field>
          <Field label="Description">
            <textarea
              value={profile.description}
              onChange={(event) => update("description", event.target.value)}
              className="input min-h-[56px] resize-none leading-5"
            />
          </Field>
          <Field label="Persona">
            <select value={profile.persona} onChange={(event) => update("persona", event.target.value)} className="input">
              {personaOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Voice">
            <select value={profile.voice} onChange={(event) => update("voice", event.target.value)} className="input">
              {voiceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4 rounded-lg border border-blue-300/12 bg-slate-950/32 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">
            <Database className="h-4 w-4 text-ritual-green" />
            User Storage
          </div>
          <div className="mt-3 grid gap-3">
            <Field label="Memory Provider">
              <select
                value={profile.storage.memory.platform}
                onChange={(event) => updateMemory("platform", event.target.value as StoragePlatform)}
                className="input"
              >
                {Object.entries(storagePlatformLabels).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Memory Path">
              <input
                value={profile.storage.memory.path}
                onChange={(event) => updateMemory("path", event.target.value)}
                className="input font-mono text-xs"
                placeholder="org/repo/path/memory.jsonl"
              />
            </Field>
            <Field label="Output Provider">
              <select
                value={profile.storage.output.platform}
                onChange={(event) => updateOutput("platform", event.target.value as StoragePlatform)}
                className="input"
              >
                {Object.entries(storagePlatformLabels).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Output Path">
              <input
                value={profile.storage.output.path}
                onChange={(event) => updateOutput("path", event.target.value)}
                className="input font-mono text-xs"
                placeholder="org/repo/path/outputs.jsonl"
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Memory KeyRef">
                <input
                  value={profile.storage.memory.keyRef}
                  onChange={(event) => updateMemory("keyRef", event.target.value)}
                  className="input font-mono text-xs"
                  placeholder="HF_TOKEN"
                />
              </Field>
              <Field label="Output KeyRef">
                <input
                  value={profile.storage.output.keyRef}
                  onChange={(event) => updateOutput("keyRef", event.target.value)}
                  className="input font-mono text-xs"
                  placeholder="HF_TOKEN"
                />
              </Field>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-md border border-ritual-green/15 bg-ritual-green/5 p-2 text-xs text-slate-400">
            <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ritual-green" />
            <span>Tokens stay user-owned. RAgent stores references; credentials are encrypted before Ritual execution.</span>
          </div>
        </div>
        <motion.div
          className="mt-3 rounded-lg border border-ritual-green/15 bg-ritual-green/5 p-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            Lab Status <span className="h-2 w-2 rounded-full bg-ritual-green shadow-neon-green" />
          </div>
          <p className="mt-1 text-xs text-slate-400">All systems nominal</p>
          <div className="waveform mt-2 h-7 overflow-hidden rounded-md" aria-hidden="true">
            <div />
          </div>
        </motion.div>
      </div>
    </GlassCard>
  );
}

function ensureStorageSecret(secrets: SecretRef[], ref: StorageRef) {
  if (ref.platform === "inline" || !ref.keyRef) return secrets;
  if (secrets.some((secret) => secret.key === ref.keyRef)) return secrets;
  return [...secrets, storageSecretFor(ref.keyRef)];
}

function storageSecretFor(keyRef: string): SecretRef {
  if (keyRef === "GCS_CREDS") {
    return {
      key: "GCS_CREDS",
      label: '{"service_account_json": "{...}", "bucket": "my-bucket"}',
      encrypted: false,
    };
  }
  if (keyRef === "PINATA_JWT") {
    return {
      key: "PINATA_JWT",
      label: "Pinata JWT or JSON with jwt/gateway_url",
      encrypted: false,
    };
  }
  return {
    key: keyRef,
    label: `${keyRef} credential`,
    encrypted: false,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}
