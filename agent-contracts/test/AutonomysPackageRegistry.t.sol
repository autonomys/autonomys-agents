// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AutonomysPackageRegistry.sol";

contract AutonomysPackageRegistryTest is Test {
    AutonomysPackageRegistry public registry;
    address public owner;
    address public user1;
    address public user2;

    // Helper variables for testing
    string public testToolName;
    bytes32 public testToolNameHash;
    AutonomysPackageRegistry.Version public version1;
    AutonomysPackageRegistry.Version public version2;
    AutonomysPackageRegistry.Version public version3;
    bytes32 public cidHash;
    bytes32 public metadataHash;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        // Deploy contract
        registry = new AutonomysPackageRegistry();
        
        // Set up common test values
        testToolName = "test-tool";
        testToolNameHash = keccak256(bytes(testToolName));
        
        // Setup versions as structs
        version1 = AutonomysPackageRegistry.Version(1, 0, 0);
        version2 = AutonomysPackageRegistry.Version(1, 1, 0);
        version3 = AutonomysPackageRegistry.Version(2, 0, 0);
        
        cidHash = keccak256(bytes("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"));
        metadataHash = keccak256(bytes('{"description":"A test tool"}'));
    }

    // Test registering a tool
    function testRegisterTool() public {
        // Register a tool from user1
        vm.startPrank(user1);
        registry.registerTool(
            testToolName,
            version1,
            cidHash, 
            metadataHash
        );
        vm.stopPrank();
        
        // Verify tool exists
        (address toolOwner, uint256 versionCount, AutonomysPackageRegistry.Version memory latestVersion) = registry.getToolInfo(testToolNameHash);
        assertEq(toolOwner, user1);
        assertEq(versionCount, 1);
        assertEq(latestVersion.major, version1.major);
        assertEq(latestVersion.minor, version1.minor);
        assertEq(latestVersion.patch, version1.patch);
        
        // Verify tool version information
        (AutonomysPackageRegistry.Version memory retrievedVersion, bytes32 cid, uint256 timestamp, bytes32 metadata) = registry.getToolVersion(testToolNameHash, version1);
        assertEq(retrievedVersion.major, version1.major);
        assertEq(retrievedVersion.minor, version1.minor);
        assertEq(retrievedVersion.patch, version1.patch);
        assertEq(cid, cidHash);
        assertTrue(timestamp > 0);
        assertEq(metadata, metadataHash);
    }
    
    // Test updating a tool with a new version
    function testUpdateToolVersion() public {
        bytes32 cidHash2 = keccak256(bytes("bafybeihykxkphwebwt6ekadmmkatcvhhelincvkwb6mah7sez4lukkqgqu"));
        bytes32 metadataHash2 = keccak256(bytes('{"description":"Updated version"}'));
        
        // Register initial version
        vm.startPrank(user1);
        registry.registerTool(
            testToolName, 
            version1, 
            cidHash, 
            metadataHash
        );
        
        // Update with new version
        registry.registerTool(
            testToolName, 
            version2, 
            cidHash2, 
            metadataHash2
        );
        vm.stopPrank();
        
        // Verify both versions exist
        AutonomysPackageRegistry.Version[] memory versions = registry.getToolVersions(testToolNameHash);
        assertEq(versions.length, 2);
        
        // Verify latest version is set correctly
        (AutonomysPackageRegistry.Version memory version, bytes32 cid, uint256 timestamp, bytes32 metadata) = registry.getLatestVersion(testToolNameHash);
        assertEq(version.major, version2.major);
        assertEq(version.minor, version2.minor);
        assertEq(version.patch, version2.patch);
        assertEq(cid, cidHash2);
        assertEq(metadata, metadataHash2);
        assertTrue(timestamp > 0);
    }
    
    // Test attempting to register a lower version
    function testLowerVersionRejection() public {
        // Register initial version
        vm.startPrank(user1);
        registry.registerTool(testToolName, version2, cidHash, metadataHash);
        
        // Try to register a lower version (should fail)
        vm.expectRevert(AutonomysPackageRegistry.InvalidVersionOrder.selector);
        registry.registerTool(
            testToolName, 
            version1,  // 1.0.0 is lower than current 1.1.0
            cidHash, 
            metadataHash
        );
        vm.stopPrank();
    }
    
    // Test updating metadata for a version
    function testUpdateToolMetadata() public {
        bytes32 newMetadataHash = keccak256(bytes('{"description":"Updated description","keywords":["test","tool"]}'));
        
        // Register tool
        vm.startPrank(user1);
        registry.registerTool(
            testToolName, 
            version1, 
            cidHash, 
            metadataHash
        );
        
        // Update metadata
        registry.updateToolMetadata(
            testToolName,
            testToolNameHash,
            version1,
            newMetadataHash
        );
        vm.stopPrank();
        
        // Verify metadata was updated
        (,,, bytes32 metadata) = registry.getToolVersion(testToolNameHash, version1);
        assertEq(metadata, newMetadataHash);
    }
    
    // Test transferring tool ownership
    function testTransferToolOwnership() public {
        // Register tool as user1
        vm.startPrank(user1);
        registry.registerTool(
            testToolName, 
            version1, 
            cidHash, 
            metadataHash
        );
        
        // Transfer ownership to user2
        registry.transferToolOwnership(
            testToolName,
            testToolNameHash, 
            user2
        );
        vm.stopPrank();
        
        // Verify new owner
        (address toolOwner,,) = registry.getToolInfo(testToolNameHash);
        assertEq(toolOwner, user2);
        
        // Verify old owner can't update tool
        vm.startPrank(user1);
        vm.expectRevert(AutonomysPackageRegistry.NotToolOwner.selector);
        registry.updateToolMetadata(
            testToolName, 
            testToolNameHash,
            version1, 
            keccak256(bytes('{"description":"Unauthorized update"}'))
        );
        vm.stopPrank();
        
        // Verify new owner can update tool
        vm.startPrank(user2);
        registry.updateToolMetadata(
            testToolName, 
            testToolNameHash,
            version1, 
            keccak256(bytes('{"description":"Authorized update"}'))
        );
        vm.stopPrank();
    }
    
    // Test getting publisher tools
    function testGetPublisherTools() public {
        string memory toolName1 = "tool1";
        string memory toolName2 = "tool2";
        string memory toolName3 = "tool3";
        
        bytes32 toolNameHash1 = keccak256(bytes(toolName1));
        bytes32 toolNameHash2 = keccak256(bytes(toolName2));
        bytes32 toolNameHash3 = keccak256(bytes(toolName3));
        
        bytes32 cidHash1 = keccak256(bytes("bafybeiid1s"));
        bytes32 cidHash2 = keccak256(bytes("bafybeicid2"));
        bytes32 cidHash3 = keccak256(bytes("bafybeicid3"));
        
        bytes32 metadataHash1 = keccak256(bytes('{"description":"Tool 1"}'));
        bytes32 metadataHash2 = keccak256(bytes('{"description":"Tool 2"}'));
        bytes32 metadataHash3 = keccak256(bytes('{"description":"Tool 3"}'));
        
        // Register multiple tools from user1
        vm.startPrank(user1);
        registry.registerTool(toolName1, version1, cidHash1, metadataHash1);
        registry.registerTool(toolName2, version1, cidHash2, metadataHash2);
        registry.registerTool(toolName3, version1, cidHash3, metadataHash3);
        vm.stopPrank();
        
        // Verify publisher tools
        bytes32[] memory publisherTools = registry.getPublisherToolsPaginated(user1, 0, 10);
        assertEq(publisherTools.length, 3);
        
        // Check that all tools are included (order may vary)
        bool found1 = false;
        bool found2 = false;
        bool found3 = false;
        
        for (uint i = 0; i < publisherTools.length; i++) {
            if (publisherTools[i] == toolNameHash1) found1 = true;
            if (publisherTools[i] == toolNameHash2) found2 = true;
            if (publisherTools[i] == toolNameHash3) found3 = true;
        }
        
        assertTrue(found1 && found2 && found3, "All published tools should be included");
    }
    
    // Test pagination of publisher tools
    function testGetPublisherToolsPagination() public {
        string[] memory toolNames = new string[](5);
        bytes32[] memory toolNameHashes = new bytes32[](5);
        
        for (uint i = 0; i < 5; i++) {
            toolNames[i] = string(abi.encodePacked("tool", i+1));
            toolNameHashes[i] = keccak256(bytes(toolNames[i]));
        }
        
        // Register 5 tools from user1
        vm.startPrank(user1);
        for (uint i = 0; i < 5; i++) {
            registry.registerTool(
                toolNames[i], 
                version1, 
                keccak256(abi.encodePacked("cid", i+1)), 
                keccak256(abi.encodePacked('{"description":"Tool ', i+1, '"}'))
            );
        }
        vm.stopPrank();
        
        // Test first page (2 items)
        bytes32[] memory page1 = registry.getPublisherToolsPaginated(user1, 0, 2);
        assertEq(page1.length, 2);
        
        // Test second page (2 items)
        bytes32[] memory page2 = registry.getPublisherToolsPaginated(user1, 2, 2);
        assertEq(page2.length, 2);
        
        // Test last page (1 item)
        bytes32[] memory page3 = registry.getPublisherToolsPaginated(user1, 4, 2);
        assertEq(page3.length, 1);
        
        // Verify we get all 5 tools with one query
        bytes32[] memory allTools = registry.getPublisherToolsPaginated(user1, 0, 10);
        assertEq(allTools.length, 5);
    }
    
    // Test transferring contract ownership
    function testTransferContractOwnership() public {
        // Transfer contract ownership to user1
        registry.transferContractOwnership(user1);
        
        // Verify new owner
        assertEq(registry.owner(), user1);
        
        // Original owner can't call owner-only functions anymore
        vm.expectRevert(AutonomysPackageRegistry.OnlyOwner.selector);
        registry.transferContractOwnership(user2);
        
        // New owner can call owner-only functions
        vm.startPrank(user1);
        registry.transferContractOwnership(user2);
        vm.stopPrank();
        
        // Verify ownership changed again
        assertEq(registry.owner(), user2);
    }
    
    // Test attempting to register a duplicate tool name
    function testRegisterDuplicateName() public {
        // Register tool by user1
        vm.startPrank(user1);
        registry.registerTool(testToolName, version1, cidHash, metadataHash);
        vm.stopPrank();
        
        // Try to register same name by user2
        vm.startPrank(user2);
        vm.expectRevert(AutonomysPackageRegistry.NotToolOwner.selector);
        registry.registerTool(testToolName, version1, cidHash, metadataHash);
        vm.stopPrank();
    }
    
    // Test attempting to register an existing version
    function testRegisterExistingVersion() public {
        // Register tool version
        vm.startPrank(user1);
        registry.registerTool(testToolName, version1, cidHash, metadataHash);
        
        // Try to register same version again (with different CID/metadata)
        bytes32 newCidHash = keccak256(bytes("bafybeinewcid"));
        bytes32 newMetadataHash = keccak256(bytes('{"description":"New metadata for same version"}'));
        
        vm.expectRevert(AutonomysPackageRegistry.VersionAlreadyExists.selector);
        registry.registerTool(testToolName, version1, newCidHash, newMetadataHash);
        vm.stopPrank();
    }
    
    // Test the getAllTools function
    function testGetAllTools() public {
        string memory toolName1 = "all-tools-test-1";
        string memory toolName2 = "all-tools-test-2";
        string memory toolName3 = "all-tools-test-3";
        
        bytes32 toolNameHash1 = keccak256(bytes(toolName1));
        bytes32 toolNameHash2 = keccak256(bytes(toolName2));
        bytes32 toolNameHash3 = keccak256(bytes(toolName3));
        
        // Register tools by different users
        vm.startPrank(user1);
        registry.registerTool(toolName1, version1, cidHash, metadataHash);
        vm.stopPrank();
        
        vm.startPrank(user2);
        registry.registerTool(toolName2, version1, cidHash, metadataHash);
        registry.registerTool(toolName3, version1, cidHash, metadataHash);
        vm.stopPrank();
        
        // Get all tools
        bytes32[] memory allTools = registry.getAllToolsPaginated(0, 10);
        
        // Verify all tools are included
        assertEq(allTools.length, 3);
        
        bool found1 = false;
        bool found2 = false;
        bool found3 = false;
        
        for (uint i = 0; i < allTools.length; i++) {
            if (allTools[i] == toolNameHash1) found1 = true;
            if (allTools[i] == toolNameHash2) found2 = true;
            if (allTools[i] == toolNameHash3) found3 = true;
        }
        
        assertTrue(found1 && found2 && found3, "All tools should be included");
    }
    
    // Test pagination of all tools
    function testGetAllToolsPagination() public {
        // Create and register 5 tools
        string[] memory toolNames = new string[](5);
        bytes32[] memory toolNameHashes = new bytes32[](5);
        
        for (uint i = 0; i < 5; i++) {
            toolNames[i] = string(abi.encodePacked("pagination-test", i+1));
            toolNameHashes[i] = keccak256(bytes(toolNames[i]));
            
            vm.startPrank(user1);
            registry.registerTool(
                toolNames[i], 
                version1, 
                cidHash, 
                metadataHash
            );
            vm.stopPrank();
        }
        
        // Test first page (2 items)
        bytes32[] memory page1 = registry.getAllToolsPaginated(0, 2);
        assertEq(page1.length, 2);
        
        // Test second page (2 items)
        bytes32[] memory page2 = registry.getAllToolsPaginated(2, 2);
        assertEq(page2.length, 2);
        
        // Test third page (1 item)
        bytes32[] memory page3 = registry.getAllToolsPaginated(4, 2);
        assertEq(page3.length, 1);
        
        // Verify we get all 5 tools
        bytes32[] memory allTools = registry.getAllToolsPaginated(0, 10);
        assertEq(allTools.length, 5);
    }
    
    // Test the getToolCount function
    function testGetToolCount() public {
        // Initially no tools
        assertEq(registry.getToolCount(), 0);
        
        // Add tools and check count
        vm.startPrank(user1);
        registry.registerTool("count-test-1", version1, cidHash, metadataHash);
        assertEq(registry.getToolCount(), 1);
        
        registry.registerTool("count-test-2", version1, cidHash, metadataHash);
        assertEq(registry.getToolCount(), 2);
        
        registry.registerTool("count-test-3", version1, cidHash, metadataHash);
        assertEq(registry.getToolCount(), 3);
        vm.stopPrank();
    }
    
    // Test internal compareVersions function by creating a version that should be higher
    function testVersionOrdering() public {
        // Create versions for testing
        AutonomysPackageRegistry.Version memory lowerVersion = AutonomysPackageRegistry.Version(1, 0, 0);
        AutonomysPackageRegistry.Version memory higherVersion = AutonomysPackageRegistry.Version(2, 0, 0);
        
        // Register tool with lower version
        vm.startPrank(user1);
        registry.registerTool(testToolName, lowerVersion, cidHash, metadataHash);
        
        // Should succeed with higher version
        registry.registerTool(testToolName, higherVersion, cidHash, metadataHash);
        
        // Verify higher version is latest
        (,, AutonomysPackageRegistry.Version memory latestVersion) = registry.getToolInfo(testToolNameHash);
        assertEq(latestVersion.major, higherVersion.major);
        assertEq(latestVersion.minor, higherVersion.minor);
        assertEq(latestVersion.patch, higherVersion.patch);
        
        vm.stopPrank();
    }
    
    // Test updating tool metadata
    function testUpdateToolMetadataWorkflow() public {
        bytes32 newMetadataHash = keccak256(bytes('{"description":"New metadata"}'));
        
        // Register tool
        vm.startPrank(user1);
        registry.registerTool(testToolName, version1, cidHash, metadataHash);
        
        // Register a second version
        registry.registerTool(testToolName, version2, cidHash, metadataHash);
        
        // Current latest version should be version2 (1.1.0)
        (,, AutonomysPackageRegistry.Version memory currentLatest) = registry.getToolInfo(testToolNameHash);
        assertEq(currentLatest.major, version2.major);
        assertEq(currentLatest.minor, version2.minor);
        assertEq(currentLatest.patch, version2.patch);
        
        // Update metadata only (not setting as latest)
        registry.updateToolMetadata(testToolName, testToolNameHash, version1, newMetadataHash);
        
        // Verify metadata updated but latest version is still version2
        (,,, bytes32 metadata) = registry.getToolVersion(testToolNameHash, version1);
        assertEq(metadata, newMetadataHash);
        (,, AutonomysPackageRegistry.Version memory latestAfterUpdate) = registry.getToolInfo(testToolNameHash);
        assertEq(latestAfterUpdate.major, version2.major);
        assertEq(latestAfterUpdate.minor, version2.minor);
        assertEq(latestAfterUpdate.patch, version2.patch);
        
        vm.stopPrank();
    }
    
    // Test updating metadata with non-existent versions
    function testUpdateNonExistentVersionMetadata() public {
        // Register tool first
        vm.startPrank(user1);
        registry.registerTool(testToolName, version1, cidHash, metadataHash);
        
        // Try to update metadata for a version that doesn't exist
        AutonomysPackageRegistry.Version memory nonExistentVersion = AutonomysPackageRegistry.Version(9, 9, 9);
        vm.expectRevert(AutonomysPackageRegistry.VersionNotExists.selector);
        registry.updateToolMetadata(testToolName, testToolNameHash, nonExistentVersion, metadataHash);
        vm.stopPrank();
    }
    
    // Test edge cases for metadata validation
    function testMetadataValidation() public {
        vm.startPrank(user1);
        
        // Test with empty metadata (should fail)
        vm.expectRevert(AutonomysPackageRegistry.EmptyMetadataHash.selector);
        registry.registerTool(testToolName, version1, cidHash, bytes32(0));
        
        vm.stopPrank();
    }
    
    // Test pagination with invalid parameters
    function testPaginationInvalidParams() public {
        // Register some tools
        vm.startPrank(user1);
        for (uint i = 0; i < 3; i++) {
            registry.registerTool(
                string(abi.encodePacked("pagination-invalid-", i)), 
                version1, 
                cidHash, 
                metadataHash
            );
        }
        vm.stopPrank();
        
        // Test with offset out of bounds
        vm.expectRevert(AutonomysPackageRegistry.OffsetOutOfBounds.selector);
        registry.getPublisherToolsPaginated(user1, 10, 2);
        
        // Test with offset out of bounds for all tools
        vm.expectRevert(AutonomysPackageRegistry.OffsetOutOfBounds.selector);
        registry.getAllToolsPaginated(10, 2);
    }
    
    // Test complex workflow with multiple versions and updates
    function testComplexToolWorkflow() public {
        string memory toolName = "complex-tool";
        bytes32 toolNameHash = keccak256(bytes(toolName));
        AutonomysPackageRegistry.Version memory versionA = AutonomysPackageRegistry.Version(0, 1, 0);
        AutonomysPackageRegistry.Version memory versionB = AutonomysPackageRegistry.Version(0, 2, 0);
        AutonomysPackageRegistry.Version memory versionC = AutonomysPackageRegistry.Version(1, 0, 0);
        
        // First publisher registers tool
        vm.startPrank(user1);
        registry.registerTool(toolName, versionA, cidHash, metadataHash);
        
        // Update with new version
        registry.registerTool(toolName, versionB, cidHash, metadataHash);
        vm.stopPrank();
        
        // Transfer ownership
        vm.startPrank(user1);
        registry.transferToolOwnership(toolName, toolNameHash, user2);
        vm.stopPrank();
        
        // New owner adds a major version
        vm.startPrank(user2);
        registry.registerTool(toolName, versionC, cidHash, metadataHash);
        vm.stopPrank();
        
        // Verify history and final state
        AutonomysPackageRegistry.Version[] memory versions = registry.getToolVersions(toolNameHash);
        assertEq(versions.length, 3);
        
        (address currentOwner, uint256 versionCount, AutonomysPackageRegistry.Version memory latestVersion) = registry.getToolInfo(toolNameHash);
        assertEq(currentOwner, user2);
        assertEq(versionCount, 3);
        assertEq(latestVersion.major, versionC.major);
        assertEq(latestVersion.minor, versionC.minor);
        assertEq(latestVersion.patch, versionC.patch);
    }
    
    // Test CID validation
    function testCIDValidation() public {
        vm.startPrank(user1);
        
        // Test with empty CID (should fail)
        vm.expectRevert(AutonomysPackageRegistry.EmptyCidHash.selector);
        registry.registerTool(testToolName, version1, bytes32(0), metadataHash);
        
        vm.stopPrank();
    }
    
    // Test transferring to invalid addresses
    function testInvalidTransfers() public {
        // Register a tool
        vm.startPrank(user1);
        registry.registerTool(testToolName, version1, cidHash, metadataHash);
        
        // Try to transfer to zero address
        vm.expectRevert(AutonomysPackageRegistry.ZeroAddressNotAllowed.selector);
        registry.transferToolOwnership(testToolName, testToolNameHash, address(0));
        
        // Try to transfer to self
        vm.expectRevert(AutonomysPackageRegistry.SameOwner.selector);
        registry.transferToolOwnership(testToolName, testToolNameHash, user1);
        
        vm.stopPrank();
        
        // Try transferring contract ownership to zero address
        vm.expectRevert(AutonomysPackageRegistry.ZeroAddressNotAllowed.selector);
        registry.transferContractOwnership(address(0));
    }
    
    // Test non-existent tool operations
    function testNonExistentToolOperations() public {
        string memory nonExistentTool = "non-existent-tool";
        bytes32 nonExistentToolHash = keccak256(bytes(nonExistentTool));
        
        // Try to get info about non-existent tool
        vm.expectRevert(AutonomysPackageRegistry.ToolNotFound.selector);
        registry.getToolInfo(nonExistentToolHash);
        
        // Try to get versions of non-existent tool
        vm.expectRevert(AutonomysPackageRegistry.ToolNotFound.selector);
        registry.getToolVersions(nonExistentToolHash);
        
        // Try to get latest version of non-existent tool
        vm.expectRevert(AutonomysPackageRegistry.ToolNotFound.selector);
        registry.getLatestVersion(nonExistentToolHash);
        
        // Try to transfer ownership of non-existent tool
        vm.startPrank(user1);
        vm.expectRevert(AutonomysPackageRegistry.ToolNotFound.selector);
        registry.transferToolOwnership(nonExistentTool, nonExistentToolHash, user2);
        vm.stopPrank();
    }
    
    // Test the name hash validation
    function testInvalidNameHash() public {
        vm.startPrank(user1);
        // Try to use incorrect name hash
        bytes32 incorrectHash = keccak256(bytes("wrong-name"));
        vm.expectRevert(AutonomysPackageRegistry.InvalidNameHash.selector);
        registry.updateToolMetadata(testToolName, incorrectHash, version1, metadataHash);
        vm.stopPrank();
    }
} 