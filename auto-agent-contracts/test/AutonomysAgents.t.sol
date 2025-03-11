// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {AutonomysAgents} from "../src/AutonomysAgents.sol";

contract AgentMemoryTest is Test {
    AutonomysAgents public agents_;
    address public agent;

    function setUp() public {
        agents_ = new AutonomysAgents();
        agent = address(this);
    }

    function testSetAndGetLastMemoryHash() public {
        bytes32 testHash = bytes32(uint256(1));
        agents_.setLastMemoryHash(testHash);
        assertEq(agents_.getLastMemoryHash(agent), testHash);
    }

    function testLastMemoryHashMapping() public {
        bytes32 testHash1 = bytes32(uint256(1));
        bytes32 testHash2 = bytes32(uint256(2));
        address otherAgent = address(0x123);

        // Set hash for this contract
        agents_.setLastMemoryHash(testHash1);
        assertEq(agents_.getLastMemoryHash(agent), testHash1);
        assertEq(agents_.lastMemoryHash(agent), testHash1);

        // Set hash as other agent
        vm.prank(otherAgent);
        agents_.setLastMemoryHash(testHash2);

        // Verify each agent has their own hash
        assertEq(agents_.getLastMemoryHash(agent), testHash1);
        assertEq(agents_.getLastMemoryHash(otherAgent), testHash2);
    }

    function testUpdateHash() public {
        bytes32 firstHash = bytes32(uint256(1));
        bytes32 secondHash = bytes32(uint256(2));

        // Measure gas for first hash setting
        uint256 gasBefore = gasleft();
        agents_.setLastMemoryHash(firstHash);
        uint256 firstSetGas = gasBefore - gasleft();

        assertEq(agents_.getLastMemoryHash(agent), firstHash);

        // Measure gas for updating existing hash
        gasBefore = gasleft();
        agents_.setLastMemoryHash(secondHash);
        uint256 updateGas = gasBefore - gasleft();

        assertEq(agents_.getLastMemoryHash(agent), secondHash);

        // Log gas usage for comparison
        emit log_named_uint("Gas for first set", firstSetGas);
        emit log_named_uint("Gas for update", updateGas);
    }

    function testSetAndGetLastMonitoringHash() public {
        bytes32 testHash = bytes32(uint256(1));
        agents_.setLastMonitoringHash(testHash);
        assertEq(agents_.getLastMonitoringHash(agent), testHash);
    }

    function testLastMonitoringHashMapping() public {
        bytes32 testHash1 = bytes32(uint256(1));
        bytes32 testHash2 = bytes32(uint256(2));
        address otherAgent = address(0x123);

        // Set hash for this contract
        agents_.setLastMonitoringHash(testHash1);
        assertEq(agents_.getLastMonitoringHash(agent), testHash1);
        assertEq(agents_.lastMonitoringHash(agent), testHash1);

        // Set hash as other agent
        vm.prank(otherAgent);
        agents_.setLastMonitoringHash(testHash2);

        // Verify each agent has their own hash
        assertEq(agents_.getLastMonitoringHash(agent), testHash1);
        assertEq(agents_.getLastMonitoringHash(otherAgent), testHash2);
    }

    function testUpdateMonitoringHash() public {
        bytes32 firstHash = bytes32(uint256(1));
        bytes32 secondHash = bytes32(uint256(2));

        // Measure gas for first hash setting
        uint256 gasBefore = gasleft();
        agents_.setLastMonitoringHash(firstHash);
        uint256 firstSetGas = gasBefore - gasleft();

        assertEq(agents_.getLastMonitoringHash(agent), firstHash);

        // Measure gas for updating existing hash
        gasBefore = gasleft();
        agents_.setLastMonitoringHash(secondHash);
        uint256 updateGas = gasBefore - gasleft();

        assertEq(agents_.getLastMonitoringHash(agent), secondHash);

        // Log gas usage for comparison
        emit log_named_uint("Gas for first monitoring hash set", firstSetGas);
        emit log_named_uint("Gas for monitoring hash update", updateGas);
    }

    function testCharacterFunctions() public {
        bytes32 testCharacter = bytes32(uint256(1));
        
        // Test setting character
        agents_.setCharacter(testCharacter);
        assertEq(agents_.character(agent), testCharacter);

        // Test whitelisting
        address otherAgent = address(0x123);
        assertFalse(agents_.isCharacterWhitelisted(otherAgent));
        
        // Test whitelisting as owner
        agents_.setIsCharacterWhitelisted(otherAgent);
        assertTrue(agents_.isCharacterWhitelisted(otherAgent));
    }

    function testMemoryLabels() public {
        bytes32 label1 = bytes32(uint256(1));
        bytes32 label2 = bytes32(uint256(2));
        bytes32 label3 = bytes32(uint256(3));

        // Test adding labels
        agents_.addMemoryLabel(label1);
        agents_.addMemoryLabel(label2);
        agents_.addMemoryLabel(label3);

        // Test getting all labels
        bytes32[] memory labels = agents_.getMemoriesLabels(agent);
        assertEq(labels.length, 3);
        assertEq(labels[0], label1);
        assertEq(labels[1], label2);
        assertEq(labels[2], label3);

        // Test getting labels count
        assertEq(agents_.getMemoriesLabelsCount(agent), 3);

        // Test pagination
        bytes32[] memory page1 = agents_.getMemoriesLabelsPaginated(agent, 0, 2);
        assertEq(page1.length, 2);
        assertEq(page1[0], label1);
        assertEq(page1[1], label2);

        bytes32[] memory page2 = agents_.getMemoriesLabelsPaginated(agent, 1, 2);
        assertEq(page2.length, 1);
        assertEq(page2[0], label3);
    }

    function testLabeledMemories() public {
        bytes32 label = bytes32(uint256(1));
        bytes32 memory1 = bytes32(uint256(2));
        bytes32 memory2 = bytes32(uint256(3));
        bytes32 memory3 = bytes32(uint256(4));

        // Add label first
        agents_.addMemoryLabel(label);

        // Test adding labeled memories
        agents_.addLabeledMemory(label, memory1);
        agents_.addLabeledMemory(label, memory2);
        agents_.addLabeledMemory(label, memory3);

        // Test getting all memories for a label
        bytes32[] memory memories = agents_.getLabeledMemories(agent, label);
        assertEq(memories.length, 3);
        assertEq(memories[0], memory1);
        assertEq(memories[1], memory2);
        assertEq(memories[2], memory3);

        // Test getting memories count
        assertEq(agents_.getLabeledMemoriesCount(agent, label), 3);

        // Test pagination
        bytes32[] memory page1 = agents_.getLabeledMemoriesPaginated(agent, label, 0, 2);
        assertEq(page1.length, 2);
        assertEq(page1[0], memory1);
        assertEq(page1[1], memory2);

        bytes32[] memory page2 = agents_.getLabeledMemoriesPaginated(agent, label, 1, 2);
        assertEq(page2.length, 1);
        assertEq(page2[0], memory3);
    }

    function testMultipleLabelsAndMemories() public {
        bytes32 label1 = bytes32(uint256(1));
        bytes32 label2 = bytes32(uint256(2));
        bytes32 memory1 = bytes32(uint256(3));
        bytes32 memory2 = bytes32(uint256(4));

        // Add labels
        agents_.addMemoryLabel(label1);
        agents_.addMemoryLabel(label2);

        // Add memories for different labels
        agents_.addLabeledMemory(label1, memory1);
        agents_.addLabeledMemory(label2, memory2);

        // Verify memories are stored correctly for each label
        bytes32[] memory memories1 = agents_.getLabeledMemories(agent, label1);
        assertEq(memories1.length, 1);
        assertEq(memories1[0], memory1);

        bytes32[] memory memories2 = agents_.getLabeledMemories(agent, label2);
        assertEq(memories2.length, 1);
        assertEq(memories2[0], memory2);
    }

    function testOwnership() public {
        address newOwner = address(0x123);
        
        // Test initial ownership
        assertEq(agents_.owner(), address(this));
        
        // Test ownership transfer
        agents_.transferOwnership(newOwner);
        assertEq(agents_.owner(), newOwner);
        
        // Test only owner can whitelist
        vm.prank(newOwner);
        agents_.setIsCharacterWhitelisted(address(0x456));
        assertTrue(agents_.isCharacterWhitelisted(address(0x456)));
        
        // Test non-owner cannot whitelist
        vm.prank(address(0x789));
        vm.expectRevert("Only the owner can call this function");
        agents_.setIsCharacterWhitelisted(address(0x999));
    }

    function testOwnershipTransferRestrictions() public {
        address nonOwner = address(0x123);
        
        // Test non-owner cannot transfer ownership
        vm.prank(nonOwner);
        vm.expectRevert("Only the owner can call this function");
        agents_.transferOwnership(nonOwner);
        
        // Verify owner hasn't changed
        assertEq(agents_.owner(), address(this));
    }

    function testCharacterWhitelistingEdgeCases() public {
        address agent1 = address(0x123);
        address agent2 = address(0x456);
        
        // Test whitelisting multiple agents
        agents_.setIsCharacterWhitelisted(agent1);
        agents_.setIsCharacterWhitelisted(agent2);
        
        assertTrue(agents_.isCharacterWhitelisted(agent1));
        assertTrue(agents_.isCharacterWhitelisted(agent2));
        
        // Test whitelisting same agent multiple times (should work without issues)
        agents_.setIsCharacterWhitelisted(agent1);
        assertTrue(agents_.isCharacterWhitelisted(agent1));
    }

    function testCharacterSettingWithDifferentAgents() public {
        address agent1 = address(0x123);
        address agent2 = address(0x456);
        bytes32 character1 = bytes32(uint256(1));
        bytes32 character2 = bytes32(uint256(2));
        
        // Set characters for different agents
        vm.prank(agent1);
        agents_.setCharacter(character1);
        
        vm.prank(agent2);
        agents_.setCharacter(character2);
        
        // Verify each agent has their own character
        assertEq(agents_.character(agent1), character1);
        assertEq(agents_.character(agent2), character2);
    }

    function testPaginationEdgeCases() public {
        // Test empty pagination
        bytes32[] memory emptyPage = agents_.getMemoriesLabelsPaginated(agent, 0, 10);
        assertEq(emptyPage.length, 0);
        
        // Add some labels
        for(uint i = 1; i <= 5; i++) {
            agents_.addMemoryLabel(bytes32(i));
        }
        
        // Test pagination with page size larger than available items
        bytes32[] memory allItems = agents_.getMemoriesLabelsPaginated(agent, 0, 10);
        assertEq(allItems.length, 5);
        
        // Test pagination with offset beyond available items
        bytes32[] memory emptyResult = agents_.getMemoriesLabelsPaginated(agent, 5, 2);
        assertEq(emptyResult.length, 0);
        
        // Test pagination with partial page
        bytes32[] memory partialPage = agents_.getMemoriesLabelsPaginated(agent, 0, 3);
        assertEq(partialPage.length, 3);
        assertEq(partialPage[0], bytes32(uint256(1)));
        assertEq(partialPage[1], bytes32(uint256(2)));
        assertEq(partialPage[2], bytes32(uint256(3)));

        // Test last page
        bytes32[] memory lastPage = agents_.getMemoriesLabelsPaginated(agent, 1, 3);
        assertEq(lastPage.length, 2);
        
        // Test pagination with zero page size
        bytes32[] memory zeroPage = agents_.getMemoriesLabelsPaginated(agent, 0, 0);
        assertEq(zeroPage.length, 0);

        // Test first page with small size
        bytes32[] memory firstPage = agents_.getMemoriesLabelsPaginated(agent, 0, 2);
        assertEq(firstPage.length, 2);
        assertEq(firstPage[0], bytes32(uint256(1)));
        assertEq(firstPage[1], bytes32(uint256(2)));
    }

    function testLabeledMemoriesEdgeCases() public {
        bytes32 label = bytes32(uint256(1));
        
        // Test getting memories for non-existent label
        bytes32[] memory emptyMemories = agents_.getLabeledMemories(agent, label);
        assertEq(emptyMemories.length, 0);
        
        // Test getting count for non-existent label
        assertEq(agents_.getLabeledMemoriesCount(agent, label), 0);
        
        // Add label and test empty label
        agents_.addMemoryLabel(label);
        bytes32[] memory emptyLabelMemories = agents_.getLabeledMemories(agent, label);
        assertEq(emptyLabelMemories.length, 0);
        
        // Test pagination for empty label
        bytes32[] memory emptyPage = agents_.getLabeledMemoriesPaginated(agent, label, 0, 10);
        assertEq(emptyPage.length, 0);
    }

    function testMultiAgentLabeledMemories() public {
        address agent1 = address(0x123);
        address agent2 = address(0x456);
        bytes32 label = bytes32(uint256(1));
        bytes32 memory1 = bytes32(uint256(2));
        bytes32 memory2 = bytes32(uint256(3));
        
        // Setup memories for both agents
        vm.startPrank(agent1);
        agents_.addMemoryLabel(label);
        agents_.addLabeledMemory(label, memory1);
        vm.stopPrank();
        
        vm.startPrank(agent2);
        agents_.addMemoryLabel(label);
        agents_.addLabeledMemory(label, memory2);
        vm.stopPrank();
        
        // Verify each agent has their own memories
        bytes32[] memory memories1 = agents_.getLabeledMemories(agent1, label);
        bytes32[] memory memories2 = agents_.getLabeledMemories(agent2, label);
        
        assertEq(memories1.length, 1);
        assertEq(memories2.length, 1);
        assertEq(memories1[0], memory1);
        assertEq(memories2[0], memory2);
    }

    function testLargeNumberOfMemories() public {
        bytes32 label = bytes32(uint256(1));
        agents_.addMemoryLabel(label);
        
        // Add 100 memories
        for(uint i = 1; i <= 100; i++) {
            agents_.addLabeledMemory(label, bytes32(uint256(i)));
        }
        
        // Test total count
        assertEq(agents_.getLabeledMemoriesCount(agent, label), 100);
        
        // Test pagination with different page sizes
        bytes32[] memory page1 = agents_.getLabeledMemoriesPaginated(agent, label, 0, 10);
        assertEq(page1.length, 10);
        assertEq(page1[0], bytes32(uint256(1)));
        assertEq(page1[9], bytes32(uint256(10)));
        
        bytes32[] memory lastPage = agents_.getLabeledMemoriesPaginated(agent, label, 9, 10);
        assertEq(lastPage.length, 10);
        assertEq(lastPage[0], bytes32(uint256(91)));
        assertEq(lastPage[9], bytes32(uint256(100)));
    }

    function testMemoryHashOverwrite() public {
        bytes32 hash1 = bytes32(uint256(1));
        bytes32 hash2 = bytes32(uint256(2));
        
        // Test memory hash overwrite
        agents_.setLastMemoryHash(hash1);
        agents_.setLastMemoryHash(hash2);
        assertEq(agents_.getLastMemoryHash(agent), hash2);
        
        // Test monitoring hash overwrite
        agents_.setLastMonitoringHash(hash1);
        agents_.setLastMonitoringHash(hash2);
        assertEq(agents_.getLastMonitoringHash(agent), hash2);
    }

    function testMemoryContract() public {
        // Test initial state
        assertEq(agents_.memoryContract(), address(0));

        // Test setting memory contract by owner
        address newMemoryContract = address(0x123);
        agents_.setMemoryContract(newMemoryContract);
        assertEq(agents_.memoryContract(), newMemoryContract);

        // Test updating memory contract
        address updatedMemoryContract = address(0x456);
        agents_.setMemoryContract(updatedMemoryContract);
        assertEq(agents_.memoryContract(), updatedMemoryContract);

        // Test non-owner cannot set memory contract
        address nonOwner = address(0x789);
        vm.prank(nonOwner);
        vm.expectRevert("Only the owner can call this function");
        agents_.setMemoryContract(address(0x999));
    }
}
