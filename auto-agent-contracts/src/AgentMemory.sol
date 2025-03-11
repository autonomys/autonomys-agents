// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AgentMemory {
    mapping(address => bytes32) public character;
    mapping(address => bool) public isCharacterWhitelisted;

    mapping(address => bytes32) public lastMemoryHash;
    mapping(address => bytes32[]) public memoriesLabels;
    mapping(address => mapping(bytes32 => bytes32[])) public labeledMemories;

    mapping(address => bytes32) public lastMonitoringHash;

    address public owner;

    event CharacterSet(address indexed agent, bytes32 character);
    event CharacterWhitelisted(address indexed agent);

    event LastMemoryHashSet(address indexed agent, bytes32 hash);
    event MemoryLabelAdded(address indexed agent, bytes32 indexed labelHash);
    event LabeledMemoryAdded(address indexed agent, bytes32 indexed labelHash, bytes32 memoryHash);

    event LastMonitoringHashSet(address indexed agent, bytes32 hash);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function setCharacter(bytes32 _character) public {
        character[msg.sender] = _character;
        emit CharacterSet(msg.sender, _character);
    }

    function setIsCharacterWhitelisted(address _agent) public onlyOwner {
        isCharacterWhitelisted[_agent] = true;
        emit CharacterWhitelisted(_agent);
    }

    function setLastMemoryHash(bytes32 hash) public {
        lastMemoryHash[msg.sender] = hash;
        emit LastMemoryHashSet(msg.sender, hash);
    }

    function setLastMonitoringHash(bytes32 hash) public {
        lastMonitoringHash[msg.sender] = hash;
        emit LastMonitoringHashSet(msg.sender, hash);
    }

    function getLastMemoryHash(address _agent) public view returns (bytes32) {
        return lastMemoryHash[_agent];
    }

    function getLastMonitoringHash(address _agent) public view returns (bytes32) {
        return lastMonitoringHash[_agent];
    }

    function addLabeledMemory(bytes32 _labelHash, bytes32 _memoryHash) public {
        labeledMemories[msg.sender][_labelHash].push(_memoryHash);
        emit LabeledMemoryAdded(msg.sender, _labelHash, _memoryHash);
    }

    function addMemoryLabel(bytes32 _labelHash) public {
        memoriesLabels[msg.sender].push(_labelHash);
        emit MemoryLabelAdded(msg.sender, _labelHash);
    }

    function getLabeledMemories(address _agent, bytes32 _labelHash) public view returns (bytes32[] memory) {
        return labeledMemories[_agent][_labelHash];
    }

    function getLabeledMemoriesCount(address _agent, bytes32 _labelHash) public view returns (uint256) {
        return labeledMemories[_agent][_labelHash].length;
    }

    function getLabeledMemoriesPaginated(address _agent, bytes32 _labelHash, uint256 _page, uint256 _perPage) public view returns (bytes32[] memory) {
        bytes32[] memory memories = labeledMemories[_agent][_labelHash];
        uint256 startIndex = _page * _perPage;
        uint256 endIndex = startIndex + _perPage;
        if (endIndex > memories.length) {
            endIndex = memories.length;
        }
        bytes32[] memory paginatedMemories = new bytes32[](endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            paginatedMemories[i - startIndex] = memories[i];
        }
        return paginatedMemories;
    }

    function getMemoriesLabels(address _agent) public view returns (bytes32[] memory) {
        return memoriesLabels[_agent];
    }

    function getMemoriesLabelsCount(address _agent) public view returns (uint256) {
        return memoriesLabels[_agent].length;
    }

    function getMemoriesLabelsPaginated(address _agent, uint256 _page, uint256 _perPage) public view returns (bytes32[] memory) {
        bytes32[] memory labels = memoriesLabels[_agent];
        uint256 startIndex = _page * _perPage;
        uint256 endIndex = startIndex + _perPage;
        if (endIndex > labels.length) {
            endIndex = labels.length;
        }
        bytes32[] memory paginatedLabels = new bytes32[](endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            paginatedLabels[i - startIndex] = labels[i];
        }
        return paginatedLabels;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        owner = _newOwner;
        emit OwnershipTransferred(msg.sender, _newOwner);
    }
}
