// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RAgentController} from "../src/RAgentController.sol";

interface Vm {
    function prank(address) external;
    function expectRevert(bytes4) external;
    function deal(address, uint256) external;
}

contract RAgentControllerTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address private constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;

    RAgentController private controller;

    function setUp() public {
        controller = new RAgentController();
    }

    function testRegisterAgentStoresConfig() public {
        RAgentController.StorageRef memory memoryRef = RAgentController.StorageRef({
            platform: "hf",
            path: "owner/repo/memory.jsonl",
            keyRef: "HF_TOKEN"
        });
        RAgentController.StorageRef memory outputRef = RAgentController.StorageRef({
            platform: "pinata",
            path: "",
            keyRef: "PINATA_JWT"
        });
        bytes32 salt = keccak256("agent-1");
        bytes32 secretsHash = keccak256("encrypted");

        bytes32 agentId = controller.registerAgent(
            salt,
            controller.AGENT_TYPE_SOVEREIGN(),
            "Market Sentinel",
            "MSENT",
            memoryRef,
            outputRef,
            secretsHash
        );

        RAgentController.AgentConfig memory config = controller.getAgent(agentId);
        assertEq(config.owner, address(this));
        assertEq(config.userSalt, salt);
        assertEq(uint256(config.agentType), uint256(controller.AGENT_TYPE_SOVEREIGN()));
        assertEq(config.name, "Market Sentinel");
        assertEq(config.symbol, "MSENT");
        assertEq(config.memoryRef.platform, "hf");
        assertEq(config.outputRef.keyRef, "PINATA_JWT");
        assertEq(config.secretsHash, secretsHash);
        assertTrue(config.active);
        assertEq(controller.getAgentCountByOwner(address(this)), 1);
        assertEq(controller.getAgentIdByOwnerAt(address(this), 0), agentId);
        assertEq(controller.getAllAgentCount(), 1);
        assertEq(controller.getAgentIdAt(0), agentId);
    }

    function testOwnerAgentIndexPaginates() public {
        bytes32 first = _registerDefaultAgent();
        bytes32 second = controller.registerAgent(
            keccak256("second-agent"),
            controller.AGENT_TYPE_PERSISTENT(),
            "Second Agent",
            "SAGNT",
            RAgentController.StorageRef("hf", "owner/repo/second-memory.jsonl", "HF_TOKEN"),
            RAgentController.StorageRef("pinata", "", "PINATA_JWT"),
            bytes32(0)
        );
        bytes32 third = controller.registerAgent(
            keccak256("third-agent"),
            controller.AGENT_TYPE_SOVEREIGN(),
            "Third Agent",
            "TAGNT",
            RAgentController.StorageRef("hf", "owner/repo/third-memory.jsonl", "HF_TOKEN"),
            RAgentController.StorageRef("pinata", "", "PINATA_JWT"),
            bytes32(0)
        );

        bytes32[] memory firstPage = controller.getAgentIdsByOwner(address(this), 0, 2);
        assertEq(firstPage.length, 2);
        assertEq(firstPage[0], first);
        assertEq(firstPage[1], second);

        bytes32[] memory secondPage = controller.getAgentIdsByOwner(address(this), 2, 2);
        assertEq(secondPage.length, 1);
        assertEq(secondPage[0], third);

        bytes32[] memory emptyPage = controller.getAgentIdsByOwner(address(this), 3, 2);
        assertEq(emptyPage.length, 0);
    }

    function testComputeAgentIdIsDeterministicAndOwnerScoped() public view {
        bytes32 salt = keccak256("stable");
        bytes32 first = controller.computeAgentId(address(this), salt, "Agent", "AGNT");
        bytes32 second = controller.computeAgentId(address(this), salt, "Agent", "AGNT");
        bytes32 otherOwner = controller.computeAgentId(address(0xCAFE), salt, "Agent", "AGNT");
        bytes32 otherSalt = controller.computeAgentId(address(this), keccak256("other"), "Agent", "AGNT");

        assertEq(first, second);
        assertNotEq(first, otherOwner);
        assertNotEq(first, otherSalt);
    }

    function testUpdateStorageRequiresOwner() public {
        RAgentController.StorageRef memory memoryRef = RAgentController.StorageRef("hf", "a/b/memory.jsonl", "HF_TOKEN");
        RAgentController.StorageRef memory outputRef = RAgentController.StorageRef("pinata", "", "PINATA_JWT");
        bytes32 agentId = controller.registerAgent(
            keccak256("agent-2"),
            controller.AGENT_TYPE_PERSISTENT(),
            "Research Oracle",
            "RORCL",
            memoryRef,
            outputRef,
            bytes32(0)
        );

        vm.prank(address(0xBEEF));
        vm.expectRevert(RAgentController.NotAgentOwner.selector);
        controller.updateStorage(agentId, memoryRef, outputRef);
    }

    function testOwnerCanUpdateStorage() public {
        bytes32 agentId = _registerDefaultAgent();
        RAgentController.StorageRef memory nextMemory = RAgentController.StorageRef("hf", "owner/repo/next-memory.jsonl", "HF_TOKEN");
        RAgentController.StorageRef memory nextOutput = RAgentController.StorageRef("pinata", "QmNext", "PINATA_JWT");

        controller.updateStorage(agentId, nextMemory, nextOutput);

        RAgentController.AgentConfig memory config = controller.getAgent(agentId);
        assertEq(config.memoryRef.path, "owner/repo/next-memory.jsonl");
        assertEq(config.outputRef.path, "QmNext");
    }

    function testRegisterRejectsInvalidType() public {
        RAgentController.StorageRef memory ref = RAgentController.StorageRef("hf", "owner/repo/path", "HF_TOKEN");

        vm.expectRevert(RAgentController.InvalidAgentType.selector);
        controller.registerAgent(keccak256("bad-type"), 2, "Bad Agent", "BAD", ref, ref, bytes32(0));
    }

    function testRegisterRejectsEmptyMetadata() public {
        RAgentController.StorageRef memory ref = RAgentController.StorageRef("hf", "owner/repo/path", "HF_TOKEN");
        uint8 sovereign = controller.AGENT_TYPE_SOVEREIGN();

        vm.expectRevert(RAgentController.InvalidAgentMetadata.selector);
        controller.registerAgent(keccak256("empty-name"), sovereign, "", "BAD", ref, ref, bytes32(0));

        vm.expectRevert(RAgentController.InvalidAgentMetadata.selector);
        controller.registerAgent(keccak256("empty-symbol"), sovereign, "Bad Agent", "", ref, ref, bytes32(0));
    }

    function testRegisterRejectsDuplicateAgentId() public {
        RAgentController.StorageRef memory ref = RAgentController.StorageRef("hf", "owner/repo/path", "HF_TOKEN");
        uint8 sovereign = controller.AGENT_TYPE_SOVEREIGN();

        controller.registerAgent(keccak256("duplicate"), sovereign, "Dupe", "DUPE", ref, ref, bytes32(0));

        vm.expectRevert(RAgentController.AgentAlreadyRegistered.selector);
        controller.registerAgent(keccak256("duplicate"), sovereign, "Dupe", "DUPE", ref, ref, bytes32(0));
    }

    function testGetAgentRejectsUnknownAgent() public {
        vm.expectRevert(RAgentController.AgentNotFound.selector);
        controller.getAgent(keccak256("missing-agent"));
    }

    function testUpdateSecretsRequiresOwner() public {
        bytes32 agentId = _registerDefaultAgent();

        vm.prank(address(0xCAFE));
        vm.expectRevert(RAgentController.NotAgentOwner.selector);
        controller.updateSecretsHash(agentId, keccak256("new"));
    }

    function testOwnerCanUpdateSecretsHash() public {
        bytes32 agentId = _registerDefaultAgent();
        bytes32 nextHash = keccak256("rotated-secret");

        controller.updateSecretsHash(agentId, nextHash);

        RAgentController.AgentConfig memory config = controller.getAgent(agentId);
        assertEq(config.secretsHash, nextHash);
    }

    function testCallbackRequiresAsyncDelivery() public {
        bytes32 agentId = _registerDefaultAgent();
        bytes32 jobId = keccak256("job-1");
        controller.trackJob(agentId, jobId);

        vm.expectRevert(RAgentController.OnlyAsyncDelivery.selector);
        controller.onSovereignAgentResult(jobId, bytes("result"));
    }

    function testTrackJobRejectsUnknownAgent() public {
        vm.expectRevert(RAgentController.AgentNotFound.selector);
        controller.trackJob(keccak256("missing-agent"), keccak256("job"));
    }

    function testTrackJobRejectsZeroJobId() public {
        bytes32 agentId = _registerDefaultAgent();

        vm.expectRevert(RAgentController.InvalidJobId.selector);
        controller.trackJob(agentId, bytes32(0));
    }

    function testTrackJobRejectsDuplicateJobId() public {
        bytes32 firstAgentId = _registerDefaultAgent();
        bytes32 jobId = keccak256("duplicate-job");
        controller.trackJob(firstAgentId, jobId);

        bytes32 secondAgentId = controller.registerAgent(
            keccak256("second-agent"),
            controller.AGENT_TYPE_PERSISTENT(),
            "Second Agent",
            "SAGNT",
            RAgentController.StorageRef("hf", "owner/repo/second-memory.jsonl", "HF_TOKEN"),
            RAgentController.StorageRef("pinata", "", "PINATA_JWT"),
            bytes32(0)
        );

        vm.expectRevert(RAgentController.JobAlreadyTracked.selector);
        controller.trackJob(secondAgentId, jobId);
    }

    function testOwnerCanTrackJob() public {
        bytes32 agentId = _registerDefaultAgent();
        bytes32 jobId = keccak256("tracked-job");

        controller.trackJob(agentId, jobId);

        assertEq(controller.jobAgent(jobId), agentId);
    }

    function testCallbackRejectsUnknownTrackedJob() public {
        vm.prank(ASYNC_DELIVERY);
        vm.expectRevert(RAgentController.UnknownJob.selector);
        controller.onPersistentAgentResult(keccak256("missing-job"), bytes("result"));
    }

    function testAsyncDeliveryStoresResultOnce() public {
        bytes32 agentId = _registerDefaultAgent();
        bytes32 jobId = keccak256("job-2");
        bytes memory result = abi.encode("ok");
        controller.trackJob(agentId, jobId);

        vm.prank(ASYNC_DELIVERY);
        controller.onPersistentAgentResult(jobId, result);

        assertTrue(controller.fulfilled(jobId));
        assertEq(controller.getJobResult(jobId), result);

        vm.prank(ASYNC_DELIVERY);
        vm.expectRevert(RAgentController.AlreadyFulfilled.selector);
        controller.onPersistentAgentResult(jobId, result);
    }

    function testGetJobResultRejectsBeforeFulfillment() public {
        bytes32 agentId = _registerDefaultAgent();
        bytes32 jobId = keccak256("unfulfilled-job");
        controller.trackJob(agentId, jobId);

        vm.expectRevert(RAgentController.UnknownJob.selector);
        controller.getJobResult(jobId);
    }

    function testDirectNativeTransferReverts() public {
        vm.deal(address(this), 1 ether);

        (bool ok, bytes memory data) = address(controller).call{value: 1 wei}("");
        assertFalse(ok);
        assertSelectorEq(_selector(data), RAgentController.DirectPaymentsDisabled.selector);
    }

    function _registerDefaultAgent() private returns (bytes32) {
        return controller.registerAgent(
            keccak256("default-agent"),
            controller.AGENT_TYPE_SOVEREIGN(),
            "Default Agent",
            "DAGNT",
            RAgentController.StorageRef("hf", "owner/repo/memory.jsonl", "HF_TOKEN"),
            RAgentController.StorageRef("pinata", "", "PINATA_JWT"),
            bytes32(0)
        );
    }

    function assertEq(address a, address b) private pure {
        require(a == b, "address mismatch");
    }

    function assertEq(uint8 a, uint8 b) private pure {
        require(a == b, "uint8 mismatch");
    }

    function assertEq(uint256 a, uint256 b) private pure {
        require(a == b, "uint256 mismatch");
    }

    function assertEq(bytes32 a, bytes32 b) private pure {
        require(a == b, "bytes32 mismatch");
    }

    function assertNotEq(bytes32 a, bytes32 b) private pure {
        require(a != b, "bytes32 should differ");
    }

    function assertEq(string memory a, string memory b) private pure {
        require(keccak256(bytes(a)) == keccak256(bytes(b)), "string mismatch");
    }

    function assertEq(bytes memory a, bytes memory b) private pure {
        require(keccak256(a) == keccak256(b), "bytes mismatch");
    }

    function assertTrue(bool value) private pure {
        require(value, "expected true");
    }

    function assertFalse(bool value) private pure {
        require(!value, "expected false");
    }

    function assertSelectorEq(bytes4 a, bytes4 b) private pure {
        require(a == b, "selector mismatch");
    }

    function _selector(bytes memory data) private pure returns (bytes4 selector) {
        require(data.length >= 4, "missing selector");
        assembly {
            selector := mload(add(data, 32))
        }
    }
}
