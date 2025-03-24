// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import {Script} from "forge-std/Script.sol";
import {AutonomysPackageRegistry} from "../src/AutonomysPackageRegistry.sol";
import {console} from "forge-std/console.sol";


contract DeployScript is Script {
    function setUp() public {}

    function run() public returns (AutonomysPackageRegistry) {
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

        return registry;
    }
} 