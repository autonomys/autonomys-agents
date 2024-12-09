// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract AgentMemory {
    mapping(address => bytes32) public lastMemoryHash;

    event LastMemoryHashSet(address indexed agent, bytes32 hash);

    function setLastMemoryHash(bytes32 hash) public {
        lastMemoryHash[msg.sender] = hash;
        emit LastMemoryHashSet(msg.sender, hash);
    }

    function getLastMemoryHash(address _agent) public view returns (bytes32) {
        return lastMemoryHash[_agent];
    }
}
