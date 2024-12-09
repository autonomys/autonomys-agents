// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {AgentMemory} from "../src/AgentMemory.sol";
import {console} from "forge-std/console.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public returns (AgentMemory) {
        // Log deployment info
        console.log("Deploying AgentMemory contract");
        console.log("Deployer address:", msg.sender);
        console.log("Chain ID:", block.chainid);

        // Begin sending transactions
        vm.startBroadcast();

        // Deploy AgentMemory contract
        AgentMemory memory_ = new AgentMemory();
        console.log("AgentMemory deployed to:", address(memory_));

        // Stop sending transactions
        vm.stopBroadcast();

        return memory_;
    }
}
