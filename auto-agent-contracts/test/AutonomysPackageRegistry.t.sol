// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AutonomysPackageRegistry.sol";

contract AutonomysPackageRegistryTest is Test {
    AutonomysPackageRegistry public registry;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        // Deploy contract
        registry = new AutonomysPackageRegistry();
    }

    function testRegisterTool() public {
        // Register a tool from user1
        vm.startPrank(user1);
        registry.registerTool(
            "test-tool", 
            "1.0.0", 
            "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 
            '{"description":"A test tool"}'
        );
        vm.stopPrank();
        
        // Verify tool exists
        (address toolOwner, uint256 versionCount, string memory latestVersion) = registry.getToolInfo("test-tool");
        assertEq(toolOwner, user1);
        assertEq(versionCount, 1);
        assertEq(latestVersion, "1.0.0");
        
        // Verify tool version information
        (string memory cid, uint256 timestamp, string memory metadata) = registry.getToolVersion("test-tool", "1.0.0");
        assertEq(cid, "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");
        assertTrue(timestamp > 0);
        assertEq(metadata, '{"description":"A test tool"}');
    }
    
    function testUpdateToolVersion() public {
        // Register initial version
        vm.startPrank(user1);
        registry.registerTool(
            "test-tool", 
            "1.0.0", 
            "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 
            '{"description":"Initial version"}'
        );
        
        // Update with new version
        registry.registerTool(
            "test-tool", 
            "1.1.0", 
            "bafybeihykxkphwebwt6ekadmmkatcvhhelincvkwb6mah7sez4lukkqgqu", 
            '{"description":"Updated version"}'
        );
        vm.stopPrank();
        
        // Verify both versions exist
        string[] memory versions = registry.getToolVersions("test-tool");
        assertEq(versions.length, 2);
        
        // Verify latest version is set correctly
        (string memory version, string memory cid, , string memory metadata) = registry.getLatestVersion("test-tool");
        assertEq(version, "1.1.0");
        assertEq(cid, "bafybeihykxkphwebwt6ekadmmkatcvhhelincvkwb6mah7sez4lukkqgqu");
        assertEq(metadata, '{"description":"Updated version"}');
    }
    
    function testUpdateToolMetadata() public {
        // Register tool
        vm.startPrank(user1);
        registry.registerTool(
            "test-tool", 
            "1.0.0", 
            "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 
            '{"description":"Initial description"}'
        );
        
        // Update metadata
        registry.updateToolMetadata(
            "test-tool",
            "1.0.0",
            '{"description":"Updated description","keywords":["test","tool"]}'
        );
        vm.stopPrank();
        
        // Verify metadata was updated
        (,, string memory metadata) = registry.getToolVersion("test-tool", "1.0.0");
        assertEq(metadata, '{"description":"Updated description","keywords":["test","tool"]}');
    }
    
    function testSetLatestVersion() public {
        // Register two versions
        vm.startPrank(user1);
        registry.registerTool(
            "test-tool", 
            "1.0.0", 
            "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 
            '{"description":"v1.0.0"}'
        );
        
        registry.registerTool(
            "test-tool", 
            "2.0.0", 
            "bafybeihykxkphwebwt6ekadmmkatcvhhelincvkwb6mah7sez4lukkqgqu", 
            '{"description":"v2.0.0"}'
        );
        
        // Set 1.0.0 as latest (rolling back)
        registry.setLatestVersion("test-tool", "1.0.0");
        vm.stopPrank();
        
        // Verify latest version
        (string memory version,,,) = registry.getLatestVersion("test-tool");
        assertEq(version, "1.0.0");
    }
    
    function testTransferToolOwnership() public {
        // Register tool as user1
        vm.startPrank(user1);
        registry.registerTool(
            "test-tool", 
            "1.0.0", 
            "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 
            '{"description":"Test tool"}'
        );
        
        // Transfer ownership to user2
        registry.transferToolOwnership("test-tool", user2);
        vm.stopPrank();
        
        // Verify new owner
        (address toolOwner,,) = registry.getToolInfo("test-tool");
        assertEq(toolOwner, user2);
        
        // Verify old owner can't update tool
        vm.startPrank(user1);
        vm.expectRevert("Caller is not the tool owner");
        registry.updateToolMetadata("test-tool", "1.0.0", '{"description":"Unauthorized update"}');
        vm.stopPrank();
        
        // Verify new owner can update tool
        vm.startPrank(user2);
        registry.updateToolMetadata("test-tool", "1.0.0", '{"description":"Authorized update"}');
        vm.stopPrank();
    }
    
    function testGetPublisherTools() public {
        // Register multiple tools from user1
        vm.startPrank(user1);
        registry.registerTool("tool1", "1.0.0", "bafybeicid1", '{"description":"Tool 1"}');
        registry.registerTool("tool2", "1.0.0", "bafybeicid2", '{"description":"Tool 2"}');
        registry.registerTool("tool3", "1.0.0", "bafybeicid3", '{"description":"Tool 3"}');
        vm.stopPrank();
        
        // Verify publisher tools
        string[] memory publisherTools = registry.getPublisherTools(user1);
        assertEq(publisherTools.length, 3);
    }
    
    function testTransferContractOwnership() public {
        // Transfer contract ownership to user1
        registry.transferContractOwnership(user1);
        
        // Verify new owner
        assertEq(registry.owner(), user1);
        
        // Original owner can't call owner-only functions anymore
        vm.expectRevert("Caller is not the owner");
        registry.transferContractOwnership(user2);
        
        // New owner can call owner-only functions
        vm.startPrank(user1);
        registry.transferContractOwnership(user2);
        vm.stopPrank();
        
        // Verify ownership changed again
        assertEq(registry.owner(), user2);
    }

    // New test specifically for verifying getLatestVersion consistency
    function testGetLatestVersionConsistency() public {
        string memory testName = "version-consistency-test";
        string memory testVersion = "3.2.1";
        string memory testCid = "bafybeifjqwel37dohkjz63zaqaezldgbw4vrqxwzs6k64n2zgh37zxabvi";
        string memory testMetadata = '{"description":"Testing version consistency","keywords":["test"]}';
        
        // Register a tool with specific values
        vm.startPrank(user1);
        registry.registerTool(
            testName,
            testVersion,
            testCid,
            testMetadata
        );
        vm.stopPrank();
        
        // Get the tool info
        (,, string memory latestVersion) = registry.getToolInfo(testName);
        
        // Get latest version info
        (string memory version, string memory cid, uint256 timestamp, string memory metadata) = registry.getLatestVersion(testName);
        
        // Verify consistency
        assertEq(version, testVersion, "Version from getLatestVersion should match input version");
        assertEq(version, latestVersion, "Version from getLatestVersion should match latestVersion from getToolInfo");
        assertEq(cid, testCid, "CID from getLatestVersion should match input CID");
        assertEq(metadata, testMetadata, "Metadata from getLatestVersion should match input metadata");
        assertTrue(timestamp > 0, "Timestamp should be set");
        
        // Get specific version info
        (string memory versionCid, uint256 versionTimestamp, string memory versionMetadata) = registry.getToolVersion(testName, testVersion);
        
        // Verify consistency with getToolVersion
        assertEq(cid, versionCid, "CID from getLatestVersion should match CID from getToolVersion");
        assertEq(timestamp, versionTimestamp, "Timestamp from getLatestVersion should match timestamp from getToolVersion");
        assertEq(metadata, versionMetadata, "Metadata from getLatestVersion should match metadata from getToolVersion");
    }
    
    // Test to verify version consistency after version update
    function testGetLatestVersionAfterUpdate() public {
        // Register initial version
        vm.startPrank(user1);
        registry.registerTool(
            "update-test",
            "1.0.0",
            "bafybeicid1",
            '{"description":"Initial version"}'
        );
        
        // Verify initial version
        (string memory initialVersion, string memory initialCid,,) = registry.getLatestVersion("update-test");
        assertEq(initialVersion, "1.0.0");
        assertEq(initialCid, "bafybeicid1");
        
        // Update with new version
        string memory newVersion = "2.0.0";
        string memory newCid = "bafybeicid2";
        registry.registerTool(
            "update-test",
            newVersion,
            newCid,
            '{"description":"Updated version"}'
        );
        vm.stopPrank();
        
        // Get updated info
        (,, string memory latestVersionInfo) = registry.getToolInfo("update-test");
        
        // Get latest version details
        (string memory version, string memory cid,,) = registry.getLatestVersion("update-test");
        
        // Verify version consistency after update
        assertEq(latestVersionInfo, newVersion, "Latest version in tool info should be updated");
        assertEq(version, newVersion, "Version from getLatestVersion should match the new version");
        assertEq(cid, newCid, "CID from getLatestVersion should match the new CID");
    }
    
    // Test to verify version is maintained after setting latest version
    function testGetLatestVersionAfterSetLatest() public {
        // Register multiple versions
        vm.startPrank(user1);
        registry.registerTool(
            "multi-version-test",
            "1.0.0",
            "bafybeicid1",
            '{"description":"Version 1"}'
        );
        
        registry.registerTool(
            "multi-version-test",
            "2.0.0",
            "bafybeicid2",
            '{"description":"Version 2"}'
        );
        
        registry.registerTool(
            "multi-version-test",
            "3.0.0",
            "bafybeicid3",
            '{"description":"Version 3"}'
        );
        
        // Latest version should be 3.0.0 by default
        (string memory latestVersionBefore,,,) = registry.getLatestVersion("multi-version-test");
        assertEq(latestVersionBefore, "3.0.0");
        
        // Now set version 1.0.0 as latest
        registry.setLatestVersion("multi-version-test", "1.0.0");
        vm.stopPrank();
        
        // Check getToolInfo returns correct latest version
        (,, string memory toolInfoLatestVersion) = registry.getToolInfo("multi-version-test");
        assertEq(toolInfoLatestVersion, "1.0.0");
        
        // Check getLatestVersion returns the correct version and CID
        (string memory version, string memory cid,,) = registry.getLatestVersion("multi-version-test");
        assertEq(version, "1.0.0", "Version from getLatestVersion should be 1.0.0 after setLatestVersion");
        assertEq(cid, "bafybeicid1", "CID from getLatestVersion should match the CID of version 1.0.0");
    }
} 