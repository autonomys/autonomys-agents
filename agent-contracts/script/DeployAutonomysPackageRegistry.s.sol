// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AutonomysPackageRegistry.sol";

contract DeployAutonomysPackageRegistry is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the registry contract
        AutonomysPackageRegistry registry = new AutonomysPackageRegistry();
        
        // Log the deployment address
        console.log("AutonomysPackageRegistry deployed at:", address(registry));
        
        vm.stopBroadcast();
    }
} 