# RAgent Contracts

`RAgentController.sol` is the first on-chain controller for RAgent.

It currently provides:

- agent metadata registration with Ritual `StorageRef` values
- secrets hash tracking
- deterministic child prediction through Ritual agent factories
- RitualWallet deposit helper for contract/scheduled execution
- AsyncDelivery-protected callbacks for Sovereign and Persistent agent results
- v2 owner/global agent indexes with paginated reads

Current deployment on Ritual (Chain `1979`):

- `RAgentController`: `0xACf178AFDc9Bdd29Bd5996aB53c33B4b41A6c448`
- Deploy tx: `0x232860771cb497fb8b4d6f81fa2e08f900a33429d1827c885cf3893ffaa4b5ad`
- Deploy block: `43257100`
- Contract version: `2`

The deployment exposes indexed reads:

- `getAgentCountByOwner(owner)`
- `getAgentIdsByOwner(owner, offset, limit)`
- `getAgentIdByOwnerAt(owner, index)`
- `getAllAgentCount()`
- `getAgentIdAt(index)`

The controller itself does not call the factory launch functions. The frontend now submits guarded Sovereign factory launches directly through `SovereignAgentFactory.launchSovereignCompressed`.
