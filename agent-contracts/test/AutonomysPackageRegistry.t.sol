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
    string public version1;
    string public version2;
    string public version3;
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
        version1 = "1.0.0";
        version2 = "1.1.0";
        version3 = "2.0.0";
        cidHash = keccak256(bytes("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"));
        metadataHash = keccak256(bytes('{"description":"A test tool"}'));
    }

    // Test version parsing and comparison
    function testVersionParsing() public view {
        // Test parseVersion function
        AutonomysPackageRegistry.Version memory v1 = registry.parseVersion("1.0.0");
        AutonomysPackageRegistry.Version memory v2 = registry.parseVersion("1.1.0");
        AutonomysPackageRegistry.Version memory v3 = registry.parseVersion("2.0.0");
        AutonomysPackageRegistry.Version memory v4 = registry.parseVersion("0.1.0");
        AutonomysPackageRegistry.Version memory v5 = registry.parseVersion("1.10.0");
        AutonomysPackageRegistry.Version memory v6 = registry.parseVersion("10.0.0");
        
        // Verify that semantic ordering is correct
        assertTrue(v2.major == v1.major && v2.minor > v1.minor, "1.1.0 should have higher minor than 1.0.0");
        assertTrue(v3.major > v2.major, "2.0.0 should have higher major than 1.1.0");
        assertTrue(v1.major > v4.major, "1.0.0 should have higher major than 0.1.0");
        assertTrue(v5.major == v2.major && v5.minor > v2.minor, "1.10.0 should have higher minor than 1.1.0");
        assertTrue(v6.major > v3.major, "10.0.0 should have higher major than 2.0.0");
    }
    
    // Test version comparison function
    function testVersionComparison() public view {
        // String comparisons
        assertEq(registry.compareVersions(version1, version1), 0, "Same versions should be equal");
        assertEq(registry.compareVersions(version2, version1), 1, "1.1.0 should be greater than 1.0.0");
        assertEq(registry.compareVersions(version1, version2), -1, "1.0.0 should be less than 1.1.0");
        assertEq(registry.compareVersions(version3, version2), 1, "2.0.0 should be greater than 1.1.0");
        
        // More complex tests
        string memory v110 = "1.10.0";
        string memory v101 = "1.0.1";
        string memory v20 = "2.0.0";
        string memory v100 = "10.0.0";
        
        assertEq(registry.compareVersions(v110, "1.2.0"), 1, "1.10.0 should be greater than 1.2.0");
        assertEq(registry.compareVersions(v101, version1), 1, "1.0.1 should be greater than 1.0.0");
        assertEq(registry.compareVersions(v20, v110), 1, "2.0.0 should be greater than 1.10.0");
        assertEq(registry.compareVersions(v100, v20), 1, "10.0.0 should be greater than 2.0.0");
    }
    
    // Test invalid versions (0.0.0)
    function testInvalidVersions() public {
        // 0.0.0 should revert
        vm.expectRevert("Version 0.0.0 is not permitted");
        registry.parseVersion("0.0.0");
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
        (address toolOwner, uint256 versionCount, string memory latestVersion) = registry.getToolInfo(testToolName);
        assertEq(toolOwner, user1);
        assertEq(versionCount, 1);
        assertEq(latestVersion, version1);
        
        // Verify tool version information
        (bytes32 cid, uint256 timestamp, bytes32 metadata) = registry.getToolVersion(testToolName, version1);
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
        string[] memory versions = registry.getToolVersions(testToolName);
        assertEq(versions.length, 2);
        
        // Verify latest version is set correctly
        (string memory version, bytes32 cid, uint256 timestamp, bytes32 metadata) = registry.getLatestVersion(testToolName);
        assertEq(version, version2);
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
        vm.expectRevert("New version must be higher than the latest version");
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
            version1,
            newMetadataHash
        );
        vm.stopPrank();
        
        // Verify metadata was updated
        (,, bytes32 metadata) = registry.getToolVersion(testToolName, version1);
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
        registry.transferToolOwnership(testToolName, user2);
        vm.stopPrank();
        
        // Verify new owner
        (address toolOwner,,) = registry.getToolInfo(testToolName);
        assertEq(toolOwner, user2);
        
        // Verify old owner can't update tool
        vm.startPrank(user1);
        vm.expectRevert("Caller is not the tool owner");
        registry.updateToolMetadata(testToolName, version1, keccak256(bytes('{"description":"Unauthorized update"}')));
        vm.stopPrank();
        
        // Verify new owner can update tool
        vm.startPrank(user2);
        registry.updateToolMetadata(testToolName, version1, keccak256(bytes('{"description":"Authorized update"}')));
        vm.stopPrank();
    }
    
    // Test getting publisher tools
    function testGetPublisherTools() public {
        string memory toolName1 = "tool1";
        string memory toolName2 = "tool2";
        string memory toolName3 = "tool3";
        
        bytes32 cidHash1 = keccak256(bytes("bafybeicid1"));
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
        string[] memory publisherTools = registry.getPublisherTools(user1, 0, 10);
        assertEq(publisherTools.length, 3);
        
        // Check that all tools are included (order may vary)
        bool found1 = false;
        bool found2 = false;
        bool found3 = false;
        
        for (uint i = 0; i < publisherTools.length; i++) {
            if (keccak256(bytes(publisherTools[i])) == keccak256(bytes(toolName1))) found1 = true;
            if (keccak256(bytes(publisherTools[i])) == keccak256(bytes(toolName2))) found2 = true;
            if (keccak256(bytes(publisherTools[i])) == keccak256(bytes(toolName3))) found3 = true;
        }
        
        assertTrue(found1 && found2 && found3, "All published tools should be included");
    }
    
    // Test pagination of publisher tools
    function testGetPublisherToolsPagination() public {
        string[] memory toolNames = new string[](5);
        for (uint i = 0; i < 5; i++) {
            toolNames[i] = string(abi.encodePacked("tool", i+1));
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
        string[] memory page1 = registry.getPublisherTools(user1, 0, 2);
        assertEq(page1.length, 2);
        
        // Test second page (2 items)
        string[] memory page2 = registry.getPublisherTools(user1, 2, 2);
        assertEq(page2.length, 2);
        
        // Test last page (1 item)
        string[] memory page3 = registry.getPublisherTools(user1, 4, 2);
        assertEq(page3.length, 1);
        
        // Verify we get all 5 tools with one query
        string[] memory allTools = registry.getPublisherTools(user1, 0, 10);
        assertEq(allTools.length, 5);
    }
    
    // Test transferring contract ownership
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
    
    // Test attempting to register a duplicate tool name
    function testRegisterDuplicateName() public {
        // Register tool by user1
        vm.startPrank(user1);
        registry.registerTool(testToolName, version1, cidHash, metadataHash);
        vm.stopPrank();
        
        // Try to register same name by user2
        vm.startPrank(user2);
        vm.expectRevert("Not the tool owner");
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
        
        vm.expectRevert("Version already exists");
        registry.registerTool(testToolName, version1, newCidHash, newMetadataHash);
        vm.stopPrank();
    }
    
    // Test the getAllTools function
    function testGetAllTools() public {
        string memory toolName1 = "all-tools-test-1";
        string memory toolName2 = "all-tools-test-2";
        string memory toolName3 = "all-tools-test-3";
        
        // Register tools by different users
        vm.startPrank(user1);
        registry.registerTool(toolName1, version1, cidHash, metadataHash);
        vm.stopPrank();
        
        vm.startPrank(user2);
        registry.registerTool(toolName2, version1, cidHash, metadataHash);
        registry.registerTool(toolName3, version1, cidHash, metadataHash);
        vm.stopPrank();
        
        // Get all tools
        string[] memory allTools = registry.getAllTools(0, 10);
        
        // Verify all tools are included
        assertEq(allTools.length, 3);
        
        bool found1 = false;
        bool found2 = false;
        bool found3 = false;
        
        for (uint i = 0; i < allTools.length; i++) {
            if (keccak256(bytes(allTools[i])) == keccak256(bytes(toolName1))) found1 = true;
            if (keccak256(bytes(allTools[i])) == keccak256(bytes(toolName2))) found2 = true;
            if (keccak256(bytes(allTools[i])) == keccak256(bytes(toolName3))) found3 = true;
        }
        
        assertTrue(found1 && found2 && found3, "All tools should be included");
    }
    
    // Test pagination of all tools
    function testGetAllToolsPagination() public {
        // Create and register 5 tools
        string[] memory toolNames = new string[](5);
        
        for (uint i = 0; i < 5; i++) {
            toolNames[i] = string(abi.encodePacked("pagination-test", i+1));
            
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
        string[] memory page1 = registry.getAllTools(0, 2);
        assertEq(page1.length, 2);
        
        // Test second page (2 items)
        string[] memory page2 = registry.getAllTools(2, 2);
        assertEq(page2.length, 2);
        
        // Test third page (1 item)
        string[] memory page3 = registry.getAllTools(4, 2);
        assertEq(page3.length, 1);
        
        // Verify we get all 5 tools
        string[] memory allTools = registry.getAllTools(0, 10);
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
    
    // Test the edge cases for version comparisons with different components
    function testVersionComponentComparisons() public view {
        string memory v1_0_0 = "1.0.0";
        string memory v1_1_0 = "1.1.0";
        string memory v1_0_1 = "1.0.1";
        string memory v2_0_0 = "2.0.0";
        string memory v0_1_0 = "0.1.0";
        string memory v0_0_1 = "0.0.1";
        
        // Major version takes precedence
        assertEq(registry.compareVersions(v2_0_0, v1_1_0), 1, "2.0.0 > 1.1.0");
        assertEq(registry.compareVersions(v1_0_0, v2_0_0), -1, "1.0.0 < 2.0.0");
        
        // Minor version takes precedence when major is the same
        assertEq(registry.compareVersions(v1_1_0, v1_0_1), 1, "1.1.0 > 1.0.1");
        assertEq(registry.compareVersions(v1_0_0, v1_1_0), -1, "1.0.0 < 1.1.0");
        
        // Patch version only matters when major and minor are the same
        assertEq(registry.compareVersions(v1_0_1, v1_0_0), 1, "1.0.1 > 1.0.0");
        assertEq(registry.compareVersions(v1_0_0, v1_0_1), -1, "1.0.0 < 1.0.1");
        
        // Comparing versions with 0 components
        assertEq(registry.compareVersions(v1_0_0, v0_1_0), 1, "1.0.0 > 0.1.0");
        assertEq(registry.compareVersions(v0_1_0, v0_0_1), 1, "0.1.0 > 0.0.1");
        assertEq(registry.compareVersions(v0_0_1, v0_1_0), -1, "0.0.1 < 0.1.0");
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
        (,, string memory currentLatest) = registry.getToolInfo(testToolName);
        assertEq(currentLatest, version2);
        
        // Update metadata only (not setting as latest)
        registry.updateToolMetadata(testToolName, version1, newMetadataHash);
        
        // Verify metadata updated but latest version is still version2
        (,, bytes32 metadata) = registry.getToolVersion(testToolName, version1);
        assertEq(metadata, newMetadataHash);
        (,, string memory latestAfterUpdate) = registry.getToolInfo(testToolName);
        assertEq(latestAfterUpdate, version2);
        
        vm.stopPrank();
    }
    
    // Test handling of malformed versions
    function testMalformedVersions() public {
        // Test with non-numeric characters
        vm.expectRevert("Invalid version character");
        registry.parseVersion("1.a.0");
    }
    
    // Test version format handling
    function testVersionFormatHandling() public view {
        // Test partial version format (should be handled according to implementation)
        try registry.parseVersion("1.0") {
            // If it doesn't revert, that's fine
        } catch {
            // If it reverts, that's also an acceptable implementation
        }
        
        // Test extra version components (should be handled according to implementation)
        try registry.parseVersion("1.0.0.0") {
            // If it doesn't revert, that's fine
        } catch {
            // If it reverts, that's also an acceptable implementation
        }
    }
    
    // Test with large version numbers to check for overflows
    function testLargeVersionNumbers() public view {
        registry.parseVersion("65535.65535.65535");
        registry.parseVersion("65536.65536.65536");
        registry.parseVersion("999999.999999.999999");
        
        // Ensure proper ordering is maintained with large numbers
        assertEq(registry.compareVersions("65536.0.0", "65535.0.0"), 1, "65536.x should be > 65535.x");
        assertEq(registry.compareVersions("999999.0.0", "65536.0.0"), 1, "999999.x should be > 65536.x");
    }
    
    // Test updating metadata with non-existent versions
    function testUpdateNonExistentVersionMetadata() public {
        // Register tool first
        vm.startPrank(user1);
        registry.registerTool(testToolName, version1, cidHash, metadataHash);
        
        // Try to update metadata for a version that doesn't exist
        string memory nonExistentVersion = "9.9.9";
        vm.expectRevert("Version does not exist");
        registry.updateToolMetadata(testToolName, nonExistentVersion, metadataHash);
        vm.stopPrank();
    }
    
    // Test edge cases for metadata validation
    function testMetadataValidation() public {
        vm.startPrank(user1);
        
        // Test with empty metadata (should fail)
        vm.expectRevert("Metadata cannot be empty");
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
        vm.expectRevert("Offset out of bounds");
        registry.getPublisherTools(user1, 10, 2);
        
        // Test with offset out of bounds for all tools
        vm.expectRevert("Offset out of bounds");
        registry.getAllTools(10, 2);
        
        // Test with zero limit (should return empty array)
        string[] memory emptyResults = registry.getPublisherTools(user1, 0, 0);
        assertEq(emptyResults.length, 0);
    }
    
    // Test complex workflow with multiple versions and updates
    function testComplexToolWorkflow() public {
        string memory toolName = "complex-tool";
        string memory versionA = "0.1.0";
        string memory versionB = "0.2.0";
        string memory versionC = "1.0.0";
        
        // First publisher registers tool
        vm.startPrank(user1);
        registry.registerTool(toolName, versionA, cidHash, metadataHash);
        
        // Update with new version
        registry.registerTool(toolName, versionB, cidHash, metadataHash);
        vm.stopPrank();
        
        // Transfer ownership
        vm.startPrank(user1);
        registry.transferToolOwnership(toolName, user2);
        vm.stopPrank();
        
        // New owner adds a major version
        vm.startPrank(user2);
        registry.registerTool(toolName, versionC, cidHash, metadataHash);
        vm.stopPrank();
        
        // Verify history and final state
        string[] memory versions = registry.getToolVersions(toolName);
        assertEq(versions.length, 3);
        
        (address currentOwner, uint256 versionCount, string memory latestVersion) = registry.getToolInfo(toolName);
        assertEq(currentOwner, user2);
        assertEq(versionCount, 3);
        assertEq(latestVersion, versionC);
    }
    
    // Test CID validation
    function testCIDValidation() public {
        vm.startPrank(user1);
        
        // Test with empty CID (should fail)
        vm.expectRevert("CID cannot be empty");
        registry.registerTool(testToolName, version1, bytes32(0), metadataHash);
        
        vm.stopPrank();
    }
    
    // Test transferring to invalid addresses
    function testInvalidTransfers() public {
        // Register a tool
        vm.startPrank(user1);
        registry.registerTool(testToolName, version1, cidHash, metadataHash);
        
        // Try to transfer to zero address
        vm.expectRevert("New owner cannot be zero address");
        registry.transferToolOwnership(testToolName, address(0));
        
        // Try to transfer to self
        vm.expectRevert("New owner cannot be the same as current");
        registry.transferToolOwnership(testToolName, user1);
        
        vm.stopPrank();
        
        // Try transferring contract ownership to zero address
        vm.expectRevert("New owner cannot be zero address");
        registry.transferContractOwnership(address(0));
    }
    
    // Test non-existent tool operations
    function testNonExistentToolOperations() public {
        string memory nonExistentTool = "non-existent-tool";
        
        // Try to get info about non-existent tool
        vm.expectRevert("Tool does not exist");
        registry.getToolInfo(nonExistentTool);
        
        // Try to get versions of non-existent tool
        vm.expectRevert("Tool does not exist");
        registry.getToolVersions(nonExistentTool);
        
        // Try to get latest version of non-existent tool
        vm.expectRevert("Tool does not exist");
        registry.getLatestVersion(nonExistentTool);
        
        // Try to transfer ownership of non-existent tool
        vm.startPrank(user1);
        vm.expectRevert("Tool does not exist");
        registry.transferToolOwnership(nonExistentTool, user2);
        vm.stopPrank();
    }
} 