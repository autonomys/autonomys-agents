// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AutonomysPackageRegistry.sol";

contract DeployAutonomysPackageRegistry is Script {
    function run() public {
        // Log deployment info
        console.log("Deploying AutonomysPackageRegistry contract");
        console.log("Deployer address:", msg.sender);
        console.log("Chain ID:", block.chainid);
        
        vm.startBroadcast();
        
        // Deploy the registry contract
        AutonomysPackageRegistry registry = new AutonomysPackageRegistry();
        
        // Log the deployment address
        console.log("AutonomysPackageRegistry deployed at:", address(registry));
        
        vm.stopBroadcast();
    }
} 