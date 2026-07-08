# RAgent Contracts

`RAgentController.sol` is the first on-chain controller for RAgent.

It currently provides:

- agent metadata registration with Ritual `StorageRef` values
- secrets hash tracking
- deterministic child prediction through Ritual agent factories
- RitualWallet deposit helper for contract/scheduled execution
- AsyncDelivery-protected callbacks for Sovereign and Persistent agent results
- v2 owner/global agent indexes with paginated reads

Current v2 deployment on Ritual:

- `RAgentController`: `0xAEF0Fdb73F1728D4Fa48caC8620e454bccC294c9`
- Deploy tx: `0x431faad309db32a8705020e3a4e28a1940293ce777abbdcd8092dfaccafaa4a4`
- Deploy block: `40188451`
- Gas used: `2014685`

The v2 deployment exposes indexed reads:

- `getAgentCountByOwner(owner)`
- `getAgentIdsByOwner(owner, offset, limit)`
- `getAgentIdByOwnerAt(owner, index)`
- `getAllAgentCount()`
- `getAgentIdAt(index)`

The controller itself does not call the factory launch functions. The frontend now submits guarded Sovereign factory launches directly through `SovereignAgentFactory.launchSovereignCompressed`.
