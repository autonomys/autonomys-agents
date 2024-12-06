// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {AgentMemory} from "../src/AgentMemory.sol";

contract AgentMemoryTest is Test {
    AgentMemory public memory_;

    function setUp() public {
        memory_ = new AgentMemory();
    }

    function testSetAndGetHash() public {
        bytes32 testHash = bytes32(uint256(1));
        memory_.setHash(testHash);
        assertEq(memory_.contentHash(), testHash);
    }

    function testCIDGeneration() public {
        // This is a known Blake3 hash and its corresponding CID
        // Example hash: 0x0000000000000000000000000000000000000000000000000000000000000001
        // Should produce a CID starting with "bafkr" followed by base32 encoded hash
        bytes32 testHash = bytes32(uint256(1));
        memory_.setHash(testHash);

        string
            memory expectedCID = "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        string memory generatedCID = memory_.getFullCID();

        assertEq(generatedCID, expectedCID, "CID generation failed");
        assertTrue(memory_.verifyCID(expectedCID), "CID verification failed");
    }

    function testCIDVerification() public {
        bytes32 testHash = bytes32(uint256(1));
        memory_.setHash(testHash);

        string memory correctCID = memory_.getFullCID();
        string
            memory wrongCID = "bafkreibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

        assertTrue(
            memory_.verifyCID(correctCID),
            "Correct CID verification failed"
        );
        assertFalse(
            memory_.verifyCID(wrongCID),
            "Wrong CID verification should fail"
        );
    }

    function testRealisticBlake3Hash() public {
        // This is a realistic Blake3 hash for the text "Hello, World!"
        // Generated using the Blake3 algorithm
        bytes32 realisticHash = 0x7436f3ce9501133f7f8b131e0cb6d866fd0aa7bdd9f3545adb531626415c5f81;
        memory_.setHash(realisticHash);

        string memory generatedCID = memory_.getFullCID();
        assertTrue(
            memory_.verifyCID(generatedCID),
            "Realistic hash CID verification failed"
        );
    }

    function testCIDConstants() public {
        assertEq(memory_.VERSION(), 1, "CID version should be 1");
        assertEq(memory_.CODEC(), 0x71, "Codec should be raw (0x71)");
        assertEq(
            memory_.HASH_ALGO(),
            0x1E,
            "Hash algorithm should be Blake3-256 (0x1E)"
        );
    }
}
