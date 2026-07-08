// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
    function balanceOf(address account) external view returns (uint256);
    function lockUntil(address account) external view returns (uint256);
}

interface ISovereignAgentFactory {
    function predictHarness(address owner, bytes32 userSalt)
        external
        view
        returns (address harness, bytes32 dkmsContext);
}

interface IPersistentAgentFactory {
    function predictLauncher(address owner, bytes32 userSalt)
        external
        view
        returns (address launcher, bytes32 dkmsContext);
}

contract RAgentController {
    uint256 public constant CONTRACT_VERSION = 2;

    uint8 public constant AGENT_TYPE_SOVEREIGN = 0;
    uint8 public constant AGENT_TYPE_PERSISTENT = 1;

    address public constant RITUAL_WALLET =
        0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;
    address public constant ASYNC_DELIVERY =
        0x5A16214fF555848411544b005f7Ac063742f39F6;
    address public constant SOVEREIGN_AGENT_FACTORY =
        0x9dC4C054e53bCc4Ce0A0Ff09E890A7a8e817f304;
    address public constant PERSISTENT_AGENT_FACTORY =
        0xD4AA9D55215dc8149Af57605e70921Ea16b73591;

    struct StorageRef {
        string platform;
        string path;
        string keyRef;
    }

    struct AgentConfig {
        address owner;
        bytes32 userSalt;
        uint8 agentType;
        string name;
        string symbol;
        StorageRef memoryRef;
        StorageRef outputRef;
        bytes32 secretsHash;
        bool active;
    }

    mapping(bytes32 agentId => AgentConfig config) private agents;
    mapping(address owner => bytes32[] agentIds) private ownerAgents;
    bytes32[] private allAgentIds;
    mapping(bytes32 jobId => bytes32 agentId) public jobAgent;
    mapping(bytes32 jobId => bool fulfilled) public fulfilled;
    mapping(bytes32 jobId => bytes result) private jobResults;

    event AgentRegistered(
        bytes32 indexed agentId,
        address indexed owner,
        uint8 indexed agentType,
        bytes32 userSalt,
        bytes32 secretsHash,
        string name,
        string symbol
    );
    event AgentStorageUpdated(bytes32 indexed agentId, StorageRef memoryRef, StorageRef outputRef);
    event AgentSecretsHashUpdated(bytes32 indexed agentId, bytes32 oldHash, bytes32 newHash);
    event AgentJobTracked(bytes32 indexed agentId, bytes32 indexed jobId);
    event AgentResultDelivered(bytes32 indexed agentId, bytes32 indexed jobId, bytes result);

    error InvalidAgentType();
    error NotAgentOwner();
    error AgentNotFound();
    error AgentAlreadyRegistered();
    error UnknownJob();
    error InvalidJobId();
    error JobAlreadyTracked();
    error AlreadyFulfilled();
    error OnlyAsyncDelivery();
    error InvalidAgentMetadata();
    error DirectPaymentsDisabled();

    modifier onlyAsyncDelivery() {
        if (msg.sender != ASYNC_DELIVERY) revert OnlyAsyncDelivery();
        _;
    }

    modifier onlyAgentOwner(bytes32 agentId) {
        if (agents[agentId].owner == address(0)) revert AgentNotFound();
        if (agents[agentId].owner != msg.sender) revert NotAgentOwner();
        _;
    }

    function computeAgentId(address owner, bytes32 userSalt, string calldata name, string calldata symbol)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(owner, userSalt, name, symbol));
    }

    function registerAgent(
        bytes32 userSalt,
        uint8 agentType,
        string calldata name,
        string calldata symbol,
        StorageRef calldata memoryRef,
        StorageRef calldata outputRef,
        bytes32 secretsHash
    ) external returns (bytes32 agentId) {
        if (agentType > AGENT_TYPE_PERSISTENT) revert InvalidAgentType();
        if (bytes(name).length == 0 || bytes(symbol).length == 0) {
            revert InvalidAgentMetadata();
        }

        agentId = computeAgentId(msg.sender, userSalt, name, symbol);
        if (agents[agentId].owner != address(0)) revert AgentAlreadyRegistered();

        agents[agentId] = AgentConfig({
            owner: msg.sender,
            userSalt: userSalt,
            agentType: agentType,
            name: name,
            symbol: symbol,
            memoryRef: memoryRef,
            outputRef: outputRef,
            secretsHash: secretsHash,
            active: true
        });

        ownerAgents[msg.sender].push(agentId);
        allAgentIds.push(agentId);

        emit AgentRegistered(agentId, msg.sender, agentType, userSalt, secretsHash, name, symbol);
    }

    function updateStorage(bytes32 agentId, StorageRef calldata memoryRef, StorageRef calldata outputRef)
        external
        onlyAgentOwner(agentId)
    {
        agents[agentId].memoryRef = memoryRef;
        agents[agentId].outputRef = outputRef;
        emit AgentStorageUpdated(agentId, memoryRef, outputRef);
    }

    function updateSecretsHash(bytes32 agentId, bytes32 newHash) external onlyAgentOwner(agentId) {
        bytes32 oldHash = agents[agentId].secretsHash;
        agents[agentId].secretsHash = newHash;
        emit AgentSecretsHashUpdated(agentId, oldHash, newHash);
    }

    function trackJob(bytes32 agentId, bytes32 jobId) external onlyAgentOwner(agentId) {
        if (jobId == bytes32(0)) revert InvalidJobId();
        if (jobAgent[jobId] != bytes32(0)) revert JobAlreadyTracked();

        jobAgent[jobId] = agentId;
        emit AgentJobTracked(agentId, jobId);
    }

    function getAgent(bytes32 agentId) external view returns (AgentConfig memory) {
        if (agents[agentId].owner == address(0)) revert AgentNotFound();
        return agents[agentId];
    }

    function getAgentCountByOwner(address owner) external view returns (uint256) {
        return ownerAgents[owner].length;
    }

    function getAgentIdByOwnerAt(address owner, uint256 index) external view returns (bytes32) {
        return ownerAgents[owner][index];
    }

    function getAgentIdsByOwner(address owner, uint256 offset, uint256 limit)
        external
        view
        returns (bytes32[] memory ids)
    {
        uint256 total = ownerAgents[owner].length;
        if (offset >= total || limit == 0) {
            return new bytes32[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        ids = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            ids[i - offset] = ownerAgents[owner][i];
        }
    }

    function getAllAgentCount() external view returns (uint256) {
        return allAgentIds.length;
    }

    function getAgentIdAt(uint256 index) external view returns (bytes32) {
        return allAgentIds[index];
    }

    function getJobResult(bytes32 jobId) external view returns (bytes memory) {
        if (!fulfilled[jobId]) revert UnknownJob();
        return jobResults[jobId];
    }

    function predictAgentChild(uint8 agentType, address owner, bytes32 userSalt)
        external
        view
        returns (address child, bytes32 dkmsContext)
    {
        if (agentType == AGENT_TYPE_SOVEREIGN) {
            return ISovereignAgentFactory(SOVEREIGN_AGENT_FACTORY).predictHarness(owner, userSalt);
        }
        if (agentType == AGENT_TYPE_PERSISTENT) {
            return IPersistentAgentFactory(PERSISTENT_AGENT_FACTORY).predictLauncher(owner, userSalt);
        }
        revert InvalidAgentType();
    }

    function depositControllerFees(uint256 lockDuration) external payable {
        IRitualWallet(RITUAL_WALLET).deposit{value: msg.value}(lockDuration);
    }

    function controllerWalletState() external view returns (uint256 balance, uint256 lockUntilBlock) {
        balance = IRitualWallet(RITUAL_WALLET).balanceOf(address(this));
        lockUntilBlock = IRitualWallet(RITUAL_WALLET).lockUntil(address(this));
    }

    function onSovereignAgentResult(bytes32 jobId, bytes calldata result) external onlyAsyncDelivery {
        _storeResult(jobId, result);
    }

    function onPersistentAgentResult(bytes32 jobId, bytes calldata result) external onlyAsyncDelivery {
        _storeResult(jobId, result);
    }

    function _storeResult(bytes32 jobId, bytes calldata result) internal {
        if (fulfilled[jobId]) revert AlreadyFulfilled();

        bytes32 agentId = jobAgent[jobId];
        if (agents[agentId].owner == address(0)) revert UnknownJob();

        fulfilled[jobId] = true;
        jobResults[jobId] = result;

        emit AgentResultDelivered(agentId, jobId, result);
    }

    receive() external payable {
        revert DirectPaymentsDisabled();
    }
}
