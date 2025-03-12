// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {AutonomysAgents} from "../src/AutonomysAgents.sol";
import {console} from "forge-std/console.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public returns (AutonomysAgents) {
        // Log deployment info
        console.log("Deploying AutonomysAgents contract");
        console.log("Deployer address:", msg.sender);
        console.log("Chain ID:", block.chainid);

        // Begin sending transactions
        vm.startBroadcast();

        // Deploy AgentMemory contract
        AutonomysAgents agents_ = new AutonomysAgents();
        console.log("AutonomysAgents deployed to:", address(agents_));

        // Stop sending transactions
        vm.stopBroadcast();

        return agents_;
    }
}
