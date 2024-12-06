// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract AgentMemory {
    mapping(address => bytes32) public lastMemoryHash;

    function setLastMemoryHash(bytes32 _hash) public {
        lastMemoryHash[msg.sender] = _hash;
    }

    function getLastMemoryHash(address _agent) public view returns (bytes32) {
        return lastMemoryHash[_agent];
    }
}
