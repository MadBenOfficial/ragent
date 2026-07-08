# RAgent

**Ritual-native autonomous agent builder.** RAgent is a client-only dApp for designing, registering, and launching autonomous agents on the Ritual Chain. It wires a production React frontend directly to Ritual's system contracts and agent factories, with real wallet connectivity, on-chain metadata registration, ECIES secret encryption, and guarded factory launches.

**Live app:** https://madbenofficial.github.io/ragent/

**Controller (Ritual Chain `1979`):** `0xACf178AFDc9Bdd29Bd5996aB53c33B4b41A6c448`

---

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Agent types](#agent-types)
- [Feature set](#feature-set)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Application workflow](#application-workflow)
- [Smart contract](#smart-contract)
- [Testing and quality](#testing-and-quality)
- [Deployment](#deployment)
- [Security model](#security-model)
- [Project structure](#project-structure)

---

## Overview

RAgent turns the multi-step process of shipping a Ritual agent into a single guided workspace. From one screen a builder can:

1. Choose an agent archetype (Sovereign or Persistent).
2. Define the agent profile, mission, persona, and voice.
3. Attach user-owned storage references for memory, knowledge, and outputs.
4. Encrypt credentials client-side with ECIES before anything touches the chain.
5. Register the agent's metadata on the `RAgentController`.
6. Predict the compressed factory child address, grant it secret access, fund it, and submit a guarded live launch.

The app is fully client-side. No backend holds user secrets, and raw credential values never leave the browser un-encrypted.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                        │
│                                                              │
│  React + Vite + Tailwind                                     │
│  ├─ wagmi / viem  ──────────►  Ritual Chain RPC (id 1979)    │
│  ├─ ECIES (eciesjs)           encrypt secrets locally        │
│  └─ Zustand-free local state + localStorage preferences      │
│                                                              │
└───────────────┬──────────────────────────────────────────────┘
                │  read / write
                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Ritual Chain contracts                   │
│                                                              │
│  RAgentController   ── agent metadata, job tracking,         │
│                        AsyncDelivery result callbacks        │
│  RitualWallet       ── deposits, balance, sender lock        │
│  TEEServiceRegistry ── executor discovery                    │
│  SecretsAccessControl ── grant access to predicted children  │
│  AsyncJobTracker    ── job lifecycle events                  │
│  Sovereign / Persistent agent factories ── compressed launch │
└─────────────────────────────────────────────────────────────┘
```

## Agent types

| Type | Description | Best for |
| --- | --- | --- |
| **Sovereign** | Contract-native agent that wakes on a schedule, reasons, acts on-chain, and returns to sleep. Runs its LLM through the Ritual gateway. | Autonomous on-chain actors, monitors, executors |
| **Persistent** | Long-lived stateful agent with memory retention, heartbeats, and recovery. Uses an external LLM provider key and external DA for checkpointing. | Research, long-horizon tasks, stateful assistants |

## Feature set

**Wallet and network**
- Ritual Chain configuration for chain ID `1979`
- `wagmi` / `viem` provider setup with injected wallet connection
- live connection status, chain name, and current block display
- RitualWallet balance, lock, sender-lock, and deposit UI

**Agent design (Foundry)**
- editable agent profile: name, symbol, description, persona, voice
- editable mission editor that feeds directly into the launch prompt
- capability toggles (LLM, HTTP, Scheduler, Memory, Wallet, Secrets, ZK/FHE, Actions) plus custom capabilities
- user-owned `StorageRef` fields for memory, knowledge, and output storage

**Secrets and access**
- ECIES secret encryption using Ritual's required 12-byte nonce
- `SecretsAccessControl.grantAccess` flow for the predicted child contract
- raw credentials held only locally until encryption; never persisted by the app

**Controller integration**
- agent ID computation, child prediction, registration, storage updates, secrets-hash updates, and job tracking
- v2 owner index (`getAgentCountByOwner` / `getAgentIdsByOwner`) so registered agents list directly from the controller without RPC log-history limits
- direct factory prediction for compressed Sovereign/Persistent children

**Launch**
- Sovereign launch-plan builder with real `SovereignAgentParams`, schedule config, StorageRefs, Ritual gateway defaults, and a full launch preflight
- Persistent launch-plan builder with external provider/DA validation
- guarded `launchSovereignCompressed` / `launchPersistentCompressed` flows with editable funding and explicit confirmation
- live `AsyncJobTracker` event listeners reconcile job lifecycle updates into local launch records

**Workspace tooling**
- **Network** panel: live chain data and launch tracking
- **Modules** panel: enable/disable real agent capabilities from a searchable library
- **Analytics** panel: launch health and callback metrics from on-chain job events
- **Activity** log: tracked launches and async callbacks with copy/export
- **Settings** panel: editable, persisted preferences (default agent type, default voice, launch-confirmation requirement, log density)
- **Templates**, **Integrations**, and **Docs** tabs

## Tech stack

- **Framework:** React 18 + TypeScript + Vite 6
- **Styling:** Tailwind CSS
- **Chain:** wagmi + viem (Ritual Chain, id `1979`)
- **Crypto:** eciesjs (ECIES with 12-byte nonce)
- **Animation:** framer-motion
- **Icons:** lucide-react
- **Contracts:** Foundry (Solidity `0.8.24`, via-IR, optimizer)

## Getting started

```bash
pnpm install
pnpm run dev
```

The dev server runs on Vite's default port. Connect an injected wallet pointed at the Ritual Chain to exercise the full flow.

## Environment configuration

Create a `.env` from the template and set the deployed controller address:

```bash
cp .env.example .env
```

```dotenv
VITE_RAGENT_CONTROLLER=0xACf178AFDc9Bdd29Bd5996aB53c33B4b41A6c448
```

Never commit `.env`. Only `.env.example` is tracked as the public template. The frontend embeds `VITE_*` values at build time.

## Application workflow

1. **Connect wallet** — inject a wallet on Ritual Chain `1979`.
2. **Design the agent** — pick Sovereign or Persistent, fill the profile and mission, toggle capabilities.
3. **Attach storage** — set user-owned memory/knowledge/output `StorageRef`s.
4. **Encrypt secrets** — enter credentials; the app encrypts them locally with ECIES and derives a `secretsHash`.
5. **Register** — submit `registerAgent` to record metadata on the controller. Registered agents appear in the **Agents** tab via the on-chain owner index.
6. **Predict + grant** — the app predicts the compressed factory child and lets you grant it secret access.
7. **Fund + launch** — set non-zero DKMS/scheduler funding, confirm, and submit the guarded factory launch. Job lifecycle updates stream back through `AsyncJobTracker`.

Registering metadata is intentionally separate from live launch. A launch is only enabled once encrypted secrets, delegate access, non-zero funding, and explicit confirmation are all ready.

## Smart contract

`RAgentController.sol` stores agent metadata, tracks jobs, and receives AsyncDelivery result callbacks. It compiles with Solidity `0.8.24` and uses the canonical Ritual system addresses for RitualWallet, AsyncDelivery, and the agent factories.

**Build:**

```bash
cd contracts
forge build
```

**Deployed controller (Ritual Chain `1979`):**

| Field | Value |
| --- | --- |
| Contract version | `2` |
| Address | `0xACf178AFDc9Bdd29Bd5996aB53c33B4b41A6c448` |
| Deploy tx | `0x232860771cb497fb8b4d6f81fa2e08f900a33429d1827c885cf3893ffaa4b5ad` |
| Deploy block | `43257100` |

**Key entry points:**

- `registerAgent(...)` — records agent metadata and emits `AgentRegistered`
- `computeAgentId(...)` — deterministic agent id from owner, salt, name, symbol
- `predictAgentChild(...)` — predicts the compressed Sovereign/Persistent child
- `getAgentCountByOwner` / `getAgentIdsByOwner` — paginated owner index
- `trackJob` / `getJobResult` — job tracking and result retrieval
- `onSovereignAgentResult` / `onPersistentAgentResult` — AsyncDelivery-only callbacks

## Testing and quality

```bash
pnpm run lint     # eslint
pnpm run test     # vitest unit tests
pnpm run build    # type-check + production build
```

Contract tests:

```bash
cd contracts
forge test
```

## Deployment

The app is published to GitHub Pages as a project site. Build with the Pages base path and deploy the static output:

```bash
GHPAGES=1 pnpm run build   # emits base path /ragent/
```

The build output in `dist/` is served from the `gh-pages` branch. A `404.html` SPA fallback and `.nojekyll` marker are included so client-side routing and hashed assets resolve correctly.

## Security model

- **No backend, no custody.** All logic runs in the browser; the app never stores raw credentials.
- **Client-side encryption.** Secrets are encrypted with ECIES before leaving the browser; only the `secretsHash` and ciphertext are used on-chain.
- **Explicit launch gating.** Live factory launches require encrypted secrets, delegate access, non-zero funding, and an explicit confirmation (configurable in Settings).
- **Separation of concerns.** Metadata registration is decoupled from live launch to avoid accidental spend.

## Project structure

```
ragent/
├─ contracts/
│  ├─ src/RAgentController.sol      # controller contract
│  └─ test/RAgentController.t.sol   # forge tests
├─ src/
│  ├─ components/                   # UI: shell, rail, modals, panels
│  ├─ hooks/                        # wagmi/viem hooks, launch, settings
│  ├─ lib/                          # abis, ritual config, crypto, stores
│  ├─ views/                        # Foundry, Agents, Templates, Integrations, Docs
│  ├─ data/seedData.ts              # templates, modules, capabilities
│  └─ types.ts                      # shared types
├─ .env.example                     # public env template
└─ vite.config.ts                   # base path + build config
```
