# RAgent

Ritual-native autonomous agent builder.

The app now includes the first real integration layer:

- Ritual Chain config for chain ID `1979`
- `wagmi` / `viem` wallet provider setup
- injected wallet connection button
- user-owned `StorageRef` fields for memory and output storage
- Ritual system contract and agent factory constants
- TEE executor discovery from `TEEServiceRegistry`
- ECIES secret encryption with Ritual's required 12-byte nonce
- RitualWallet balance, lock, sender-lock, and deposit UI
- AsyncJobTracker event listeners for job lifecycle updates
- `SecretsAccessControl.grantAccess` hook for encrypted user credentials
- controller ABI wiring for agent ID computation, child prediction, registration, storage updates, secrets hash updates, and job tracking
- v2 controller owner index support for direct paginated agent lists without old log scans
- direct factory prediction for compressed Sovereign/Persistent child contracts
- Sovereign launch-plan builder with real `SovereignAgentParams`, schedule config, StorageRefs, Ritual gateway defaults, and launch preflight
- guarded `launchSovereignCompressed` transaction flow with editable funding and explicit confirmation
- `RAgentController.sol` scaffold for agent metadata, StorageRefs, job tracking, and AsyncDelivery callbacks

## Run

```bash
pnpm install
pnpm run dev
```

For production hosting, set the public controller address after the controller is deployed:

```bash
VITE_RAGENT_CONTROLLER=0xAEF0Fdb73F1728D4Fa48caC8620e454bccC294c9
```

Do not publish `.env`. Use `.env.example` as the public template.

The current frontend can connect a wallet, read Ritual system contracts, encrypt user-entered credentials, prepare controller registration data, predict compressed factory children, grant secret access to the predicted child contract, deposit to RitualWallet, and submit guarded Sovereign factory launches. Live factory launch requires explicit non-zero funding and a confirmation checkbox. User credentials are not stored by the app; raw values are only held locally until encryption.

`Agents` reads the v2 owner index (`getAgentCountByOwner` / `getAgentIdsByOwner`) so agents are listed directly from the controller and are not lost behind RPC log-history limits. If an older v1 controller is configured, the frontend falls back to recent `AgentRegistered` events.

## Test

```bash
pnpm run lint
pnpm run test
pnpm run build
```

## Contracts

```bash
cd contracts
forge build
```

The controller compiles with Solidity `0.8.24` and uses the canonical Ritual system addresses for RitualWallet, AsyncDelivery, and agent factories.

Current v2 controller:

- Address: `0xAEF0Fdb73F1728D4Fa48caC8620e454bccC294c9`
- Deploy tx: `0x431faad309db32a8705020e3a4e28a1940293ce777abbdcd8092dfaccafaa4a4`
- Deploy block: `40188451`
- Gas used: `2014685`

Previous v1 controller:

- Address: `0xA8a2C18200b5E77c85C7a5A78BaF96A54d6569C5`
- Deploy tx: `0xb4226be201c9bef3c9ac92db3ed00d6b2b603bd3cf8809df02e0029333341f5c`
- Deploy block: `40034867`
- Gas used: `1813182`

Registering metadata is separate from live agent launch. Sovereign launch is available through the frontend only after encrypted secrets, delegate access, non-zero funding, and explicit wallet confirmation are ready.
