import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, KeyRound, Loader2, Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useSignMessage } from "wagmi";
import { useExecutors } from "../hooks/useExecutors";
import { encryptSecretMap, truncateHex } from "../lib/secrets";
import { storageChecksReady, validateStorageRefs } from "../lib/storageValidation";
import type { SecretRef, SignedSecretBundle, StorageRef, StorageValidationResult } from "../types";

interface SecretEncryptionPanelProps {
  secrets: SecretRef[];
  storageRefs: StorageRef[];
  onBundleChange?: (bundle: SignedSecretBundle | null) => void;
  onStorageValidationChange?: (results: StorageValidationResult[]) => void;
}

export function SecretEncryptionPanel({ secrets, storageRefs, onBundleChange, onStorageValidationChange }: SecretEncryptionPanelProps) {
  const { selectedExecutor } = useExecutors();
  const { signMessageAsync, isPending } = useSignMessage();
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        secrets
          .filter((secret) => secret.defaultValue)
          .map((secret) => [secret.key, secret.defaultValue ?? ""]),
      ),
    [secrets],
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [bundle, setBundle] = useState<SignedSecretBundle | null>(null);
  const [storageChecks, setStorageChecks] = useState<StorageValidationResult[]>([]);
  const [isValidatingStorage, setIsValidatingStorage] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [customSecrets, setCustomSecrets] = useState<SecretRef[]>([]);
  const [error, setError] = useState<string | null>(null);

  const activeSecrets = useMemo(() => {
    const byKey = new Map<string, SecretRef>();
    for (const secret of [...secrets, ...customSecrets]) {
      if (secret.key.trim()) byKey.set(secret.key, secret);
    }
    return Array.from(byKey.values());
  }, [customSecrets, secrets]);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  async function encryptForExecutor() {
    setError(null);
    setBundle(null);
    onBundleChange?.(null);

    try {
      if (!selectedExecutor) throw new Error("No valid TEE executor found.");
      const checks = storageChecksReady(storageChecks, storageRefs) ? storageChecks : await validateStorage();
      if (!storageChecksReady(checks, storageRefs)) {
        throw new Error("Validate user storage credentials before encrypting secrets.");
      }

      const encrypted = encryptSecretMap(selectedExecutor.publicKey, values);
      const signature = await signMessageAsync({ message: { raw: encrypted.encryptedSecret } });
      const signedBundle = { ...encrypted, signature, storageChecks: checks };

      setBundle(signedBundle);
      onBundleChange?.(signedBundle);
      setValues({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not encrypt secrets.");
    }
  }

  async function validateStorage() {
    setError(null);
    setIsValidatingStorage(true);
    try {
      const results = await validateStorageRefs(storageRefs, values);
      setStorageChecks(results);
      onStorageValidationChange?.(results);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not validate storage credentials.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsValidatingStorage(false);
    }
  }

  function addCustomSecret() {
    const key = customKey.trim();
    if (!key) return;
    setCustomSecrets((current) => current.some((secret) => secret.key === key) ? current : [...current, { key, label: `${key} value`, encrypted: false }]);
    setValues((current) => ({ ...current, [key]: customValue }));
    setCustomKey("");
    setCustomValue("");
  }

  return (
    <div className="rounded-lg border border-blue-300/12 bg-slate-950/40 p-3">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-ritual-pink" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">Encrypted Secrets</h3>
      </div>
      <div className="mt-3 grid gap-2">
        {activeSecrets.map((secret) => (
          <label key={secret.key} className="grid gap-1">
            <span className="text-[11px] text-slate-500">{secret.key}</span>
            <input
              value={values[secret.key] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [secret.key]: event.target.value }))}
              className="input font-mono text-xs"
              type={secret.sensitive === false ? "text" : "password"}
              autoComplete="off"
              placeholder={secret.label}
            />
          </label>
        ))}
      </div>
      <div className="mt-3 grid gap-2 rounded-md border border-blue-300/10 bg-black/15 p-2">
        <div className="grid gap-2 sm:grid-cols-[0.8fr_1.2fr]">
          <input
            value={customKey}
            onChange={(event) => setCustomKey(event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
            className="input font-mono text-xs"
            placeholder="OPENAI_API_KEY"
          />
          <input
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            className="input font-mono text-xs"
            type="password"
            autoComplete="off"
            placeholder="Secret value"
          />
        </div>
        <button onClick={addCustomSecret} className="small-action w-full justify-center">
          <Plus className="h-3.5 w-3.5" />
          Add Secret Key
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => void encryptForExecutor()}
          disabled={isPending || isValidatingStorage || !selectedExecutor}
          className="small-action disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Lock className="h-3.5 w-3.5" />
          {isPending ? "Signing" : "Encrypt"}
        </button>
        <button
          onClick={() => void validateStorage()}
          disabled={isValidatingStorage}
          className="small-action disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isValidatingStorage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          Validate Storage
        </button>
        <button
          onClick={() => {
            setValues(initialValues);
            setBundle(null);
            setStorageChecks([]);
            onBundleChange?.(null);
            onStorageValidationChange?.([]);
            setError(null);
          }}
          className="small-action"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
      {bundle ? (
        <div className="mt-3 rounded-md border border-ritual-green/15 bg-ritual-green/5 p-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-ritual-green">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Encrypted and signed
          </div>
          <p className="mt-1 font-mono text-slate-400">hash {truncateHex(bundle.secretsHash)}</p>
          <p className="mt-1 text-slate-500">{bundle.keyCount} secret key(s): {bundle.keyNames.join(", ")}</p>
        </div>
      ) : null}
      {storageChecks.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {storageChecks.map((check) => {
            const ready = check.status === "ready";
            const Icon = ready ? CheckCircle2 : CircleAlert;
            return (
              <div key={check.id} className={`rounded-md border p-2 text-xs ${ready ? "border-ritual-green/15 bg-ritual-green/5" : "border-ritual-gold/20 bg-ritual-gold/8"}`}>
                <div className={`flex items-center gap-2 font-semibold ${ready ? "text-ritual-green" : "text-ritual-gold"}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {check.label}
                </div>
                <p className="mt-1 text-slate-500">{check.detail}</p>
              </div>
            );
          })}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-ritual-gold">{error}</p> : null}
      <p className="mt-3 text-xs text-slate-500">Raw values are local only and cleared after encryption. RAgent keeps ciphertext metadata only.</p>
    </div>
  );
}
