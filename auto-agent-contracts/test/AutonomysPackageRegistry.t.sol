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
} 