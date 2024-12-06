// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {AgentMemory} from "../src/AgentMemory.sol";

contract AgentMemoryScript is Script {
    AgentMemory public memory_;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        memory_ = new AgentMemory();

        vm.stopBroadcast();
    }
}
