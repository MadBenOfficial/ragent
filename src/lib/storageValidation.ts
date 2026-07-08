import type { StorageRef, StorageValidationResult } from "../types";

export type SecretValues = Record<string, string>;

export async function validateStorageRefs(refs: StorageRef[], secrets: SecretValues): Promise<StorageValidationResult[]> {
  const uniqueRefs = uniqueStorageRefs(refs);
  const results: StorageValidationResult[] = [];

  for (const ref of uniqueRefs) {
    results.push(await validateStorageRef(ref, secrets));
  }

  return results;
}

export async function validateStorageRef(ref: StorageRef, secrets: SecretValues): Promise<StorageValidationResult> {
  const checkedAt = new Date().toISOString();
  const base = {
    id: storageValidationId(ref),
    platform: ref.platform,
    keyRef: ref.keyRef,
    path: ref.path,
    checkedAt,
  };

  const formatError = validateStorageRefShape(ref);
  if (formatError) {
    return { ...base, status: "blocked", label: "StorageRef invalid", detail: formatError };
  }

  if (ref.platform === "inline") {
    return { ...base, status: "ready", label: "Inline content ready", detail: "Inline StorageRef does not need external credentials." };
  }

  const secretValue = secrets[ref.keyRef]?.trim();
  if (!secretValue) {
    return { ...base, status: "blocked", label: "Missing credential", detail: `${ref.keyRef} is required for ${ref.platform}.` };
  }

  try {
    if (ref.platform === "hf") return validateHuggingFace(ref, secretValue, base);
    if (ref.platform === "gcs") return validateGcs(ref, secretValue, base);
    if (ref.platform === "pinata") return validatePinata(ref, secretValue, base);
  } catch (error) {
    return {
      ...base,
      status: "blocked",
      label: "Provider validation failed",
      detail: error instanceof Error ? error.message : "The storage provider rejected the credential.",
    };
  }

  return { ...base, status: "blocked", label: "Unsupported provider", detail: `Unsupported storage platform: ${ref.platform}.` };
}

export function validateStorageRefShape(ref: StorageRef) {
  if (ref.platform === "inline") return ref.path.trim() ? null : "Inline content cannot be empty.";
  if (!ref.keyRef.trim()) return "External storage requires a keyRef that matches an encrypted secret.";
  if (ref.platform === "hf") {
    const parsed = parseHfPath(ref.path);
    if (!parsed) return "HuggingFace path must be owner/repo/path/to/file.";
  }
  if (ref.platform === "gcs" && !ref.path.trim()) return "GCS path must be an object path inside the bucket.";
  if (ref.platform === "pinata" && ref.path.trim() && !looksLikeCid(ref.path.trim())) {
    return "Pinata path must be empty for a first upload or an existing CID for follow-up writes.";
  }
  return null;
}

export function storageValidationId(ref: StorageRef) {
  return `${ref.platform}:${ref.keyRef}:${ref.path}`;
}

export function storageChecksReady(results: StorageValidationResult[], refs: StorageRef[]) {
  const required = uniqueStorageRefs(refs).filter((ref) => ref.platform !== "inline");
  if (required.length === 0) return true;
  return required.every((ref) => {
    const id = storageValidationId(ref);
    return results.some((result) => result.id === id && result.status === "ready");
  });
}

async function validateHuggingFace(
  ref: StorageRef,
  token: string,
  base: Omit<StorageValidationResult, "status" | "label" | "detail">,
): Promise<StorageValidationResult> {
  const parsed = parseHfPath(ref.path);
  if (!parsed) throw new Error("HuggingFace path must be owner/repo/path/to/file.");

  const whoami = await fetchJson("https://huggingface.co/api/whoami-v2", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const role = readNestedString(whoami, ["auth", "accessToken", "role"]);
  if (role && role !== "write" && role !== "admin") {
    return { ...base, status: "blocked", label: "HF token is read-only", detail: `Token role is ${role}; write access is required for agent memory.` };
  }

  const repo = await fetch(`https://huggingface.co/api/datasets/${encodeURIComponent(parsed.repoId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!repo.ok) {
    throw new Error(`HuggingFace dataset ${parsed.repoId} is not accessible (${repo.status}).`);
  }

  return { ...base, status: "ready", label: "HuggingFace ready", detail: `${parsed.repoId} is accessible and token scope looks writable.` };
}

async function validatePinata(
  ref: StorageRef,
  rawCredential: string,
  base: Omit<StorageValidationResult, "status" | "label" | "detail">,
): Promise<StorageValidationResult> {
  const credential = parsePinataCredential(rawCredential);
  const auth = await fetch("https://api.pinata.cloud/data/testAuthentication", {
    headers: { Authorization: `Bearer ${credential.jwt}` },
  });
  if (!auth.ok) throw new Error(`Pinata authentication failed (${auth.status}).`);
  return {
    ...base,
    status: "ready",
    label: "Pinata ready",
    detail: credential.gateway_url ? "JWT accepted and gateway URL is configured." : "JWT accepted. Gateway URL can be added later for reads.",
  };
}

async function validateGcs(
  ref: StorageRef,
  rawCredential: string,
  base: Omit<StorageValidationResult, "status" | "label" | "detail">,
): Promise<StorageValidationResult> {
  const credential = parseGcsCredential(rawCredential);
  const token = await getGcsAccessToken(credential.service_account_json);
  const prefix = encodeURIComponent(ref.path.split("/").slice(0, -1).join("/"));
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(credential.bucket)}/o?maxResults=1${prefix ? `&prefix=${prefix}` : ""}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`GCS bucket ${credential.bucket} is not accessible (${response.status}).`);
  return { ...base, status: "ready", label: "Google Cloud Storage ready", detail: `${credential.bucket} is accessible with this service account.` };
}

async function getGcsAccessToken(serviceAccountJson: string) {
  const serviceAccount = JSON.parse(serviceAccountJson) as { client_email?: string; private_key?: string; token_uri?: string };
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("GCS service_account_json must include client_email and private_key.");
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = await signJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/devstorage.read_write",
      aud: serviceAccount.token_uri ?? "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    },
    serviceAccount.private_key,
  );

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const response = await fetch(serviceAccount.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();
  if (!response.ok || typeof data.access_token !== "string") {
    throw new Error(`GCS OAuth failed (${response.status}).`);
  }
  return data.access_token as string;
}

async function signJwt(header: unknown, payload: unknown, privateKeyPem: string) {
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const input = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  return `${input}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function parseHfPath(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 3) return null;
  return {
    repoId: `${parts[0]}/${parts[1]}`,
    filePath: parts.slice(2).join("/"),
  };
}

function parseGcsCredential(raw: string) {
  const parsed = JSON.parse(raw) as { service_account_json?: string | Record<string, unknown>; bucket?: string };
  if (!parsed.bucket) throw new Error("GCS credential must include bucket.");
  const serviceAccountJson =
    typeof parsed.service_account_json === "string" ? parsed.service_account_json : JSON.stringify(parsed.service_account_json);
  if (!serviceAccountJson || serviceAccountJson === "undefined") throw new Error("GCS credential must include service_account_json.");
  return { bucket: parsed.bucket, service_account_json: serviceAccountJson };
}

function parsePinataCredential(raw: string) {
  const parsed = safeJson(raw) as { jwt?: string; gateway_url?: string } | null;
  if (!parsed?.jwt && !raw.startsWith("ey")) throw new Error("Pinata credential must be a JWT or JSON with jwt.");
  return {
    jwt: parsed?.jwt ?? raw,
    gateway_url: parsed?.gateway_url ?? "",
  };
}

function uniqueStorageRefs(refs: StorageRef[]) {
  const byId = new Map<string, StorageRef>();
  for (const ref of refs) byId.set(storageValidationId(ref), ref);
  return Array.from(byId.values());
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Request failed (${response.status}).`);
  return response.json();
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readNestedString(value: unknown, path: string[]) {
  let current = value as Record<string, unknown> | undefined;
  for (const key of path) current = current?.[key] as Record<string, unknown> | undefined;
  return typeof current === "string" ? current : undefined;
}

function looksLikeCid(value: string) {
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})$/.test(value);
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64UrlEncode(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
