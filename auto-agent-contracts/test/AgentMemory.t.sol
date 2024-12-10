// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {AgentMemory} from "../src/AgentMemory.sol";

contract AgentMemoryTest is Test {
    AgentMemory public memory_;
    address public agent;

    function setUp() public {
        memory_ = new AgentMemory();
        agent = address(this);
    }

    function testSetAndGetLastMemoryHash() public {
        bytes32 testHash = bytes32(uint256(1));
        memory_.setLastMemoryHash(testHash);
        assertEq(memory_.getLastMemoryHash(agent), testHash);
    }

    function testLastMemoryHashMapping() public {
        bytes32 testHash1 = bytes32(uint256(1));
        bytes32 testHash2 = bytes32(uint256(2));
        address otherAgent = address(0x123);

        // Set hash for this contract
        memory_.setLastMemoryHash(testHash1);
        assertEq(memory_.getLastMemoryHash(agent), testHash1);
        assertEq(memory_.lastMemoryHash(agent), testHash1);

        // Set hash as other agent
        vm.prank(otherAgent);
        memory_.setLastMemoryHash(testHash2);

        // Verify each agent has their own hash
        assertEq(memory_.getLastMemoryHash(agent), testHash1);
        assertEq(memory_.getLastMemoryHash(otherAgent), testHash2);
    }

    function testUpdateHash() public {
        bytes32 firstHash = bytes32(uint256(1));
        bytes32 secondHash = bytes32(uint256(2));

        // Measure gas for first hash setting
        uint256 gasBefore = gasleft();
        memory_.setLastMemoryHash(firstHash);
        uint256 firstSetGas = gasBefore - gasleft();

        assertEq(memory_.getLastMemoryHash(agent), firstHash);

        // Measure gas for updating existing hash
        gasBefore = gasleft();
        memory_.setLastMemoryHash(secondHash);
        uint256 updateGas = gasBefore - gasleft();

        assertEq(memory_.getLastMemoryHash(agent), secondHash);

        // Log gas usage for comparison
        emit log_named_uint("Gas for first set", firstSetGas);
        emit log_named_uint("Gas for update", updateGas);
    }
}
