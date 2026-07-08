# RAgentController Security Review

Security review for `RAgentController.sol`.

## Scope

This controller currently handles:

- agent metadata registration
- user-owned `StorageRef` pointers
- encrypted secrets hash tracking
- agent job tracking
- owner/global agent indexes for paginated agent discovery
- AsyncDelivery-gated result callbacks
- deterministic child prediction through Ritual factories
- RitualWallet deposit helper for controller-held execution budget

The controller itself does not call `SovereignAgentFactory` or `PersistentAgentFactory` launch functions.
The frontend can submit a guarded Sovereign compressed launch directly through `SovereignAgentFactory.launchSovereignCompressed` after preflight, encrypted secrets, delegate access, non-zero funding, and explicit wallet confirmation.

Current v2 deployment on Ritual:

- `RAgentController`: `0xAEF0Fdb73F1728D4Fa48caC8620e454bccC294c9`
- Deploy tx: `0x431faad309db32a8705020e3a4e28a1940293ce777abbdcd8092dfaccafaa4a4`
- Deploy block: `40188451`
- Gas used: `2014685`

## Security Properties Covered

- Only valid agent types can be registered.
- Agent names and symbols cannot be empty.
- Duplicate `agentId` registrations are rejected.
- Agent IDs are appended once to the owner index and global index during registration.
- Owner indexes are exposed through paginated reads to avoid huge return payloads.
- Only the owning EOA can update storage refs, update secrets hash, or track jobs for an agent.
- Unknown agents are rejected.
- `jobId == 0x0` is rejected.
- A `jobId` cannot be reassigned to a different agent.
- Async results are accepted only from Ritual `AsyncDelivery`.
- Async results are idempotent and cannot be fulfilled twice.
- Direct native RIT transfers are rejected to avoid stranded funds.
- Payable deposits must go through `depositControllerFees(lockDuration)`.

## Remaining Pre-Launch Work

- Run a live end-to-end Sovereign launch with user-provided storage credentials and intentionally chosen funding.
- Add integration tests against a Ritual fork for direct factory launch and system contract wiring.
- Verify source code for the deployed controller if the target explorer supports it.
- Verification attempt on 2026-07-01 with `forge verify-contract` reached Ritual but the verifier endpoint returned `{"error":"unknown path"}`.
- Do not fund this controller with execution budget; live launch is submitted directly from the user's wallet to the factory.
- Keep user API/storage credentials off-chain and encrypted client-side.
- Keep Persistent launch guarded by DA validation, external LLM credentials, secret delegation, and the higher DKMS/scheduler funding requirements documented by Ritual.

## Current Test Coverage

Run:

```bash
forge test
```

Current suite covers 20 contract tests:

- registration happy path
- deterministic agent ID
- invalid agent type
- empty metadata rejection
- duplicate registration rejection
- owner/global index reads and pagination
- owner-only storage updates
- owner-only secrets hash updates
- job tracking happy path
- unknown agent rejection
- zero job rejection
- duplicate job rejection
- AsyncDelivery-only callbacks
- unknown job callback rejection
- idempotent fulfillment
- pre-fulfillment result rejection
- direct native transfer rejection
