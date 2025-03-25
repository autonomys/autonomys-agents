// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AutonomysPackageRegistry {
    
    error OnlyOwner();
    error ToolNotFound();
    error NotToolOwner();
    error EmptyToolName();
    error InvalidVersion();
    error EmptyCidHash();
    error EmptyMetadataHash();
    error VersionNotExists();
    error ToolNameAlreadyRegistered();
    error VersionAlreadyExists();
    error InvalidVersionOrder();
    error ZeroAddressNotAllowed();
    error SameOwner();
    error OffsetOutOfBounds();
    error InvalidNameHash();

    address public owner;
   
    event ToolRegistered(string indexed name, uint256 major, uint256 minor, uint256 patch, bytes32 cidHash, address publisher, uint256 timestamp);
    event ToolUpdated(string indexed name, uint256 major, uint256 minor, uint256 patch, bytes32 cidHash, address publisher, uint256 timestamp);
    event OwnershipTransferred(string indexed name, address previousOwner, address newOwner);

    struct Version {
        uint64 major;
        uint64 minor;
        uint64 patch;
    }

    struct ToolVersion {
        Version version;
        bytes32 cidHash;   
        uint256 timestamp; 
        bytes32 metadataHash;  
    }

    struct Tool {
        address owner;
        bytes32[] versionHashes;
        mapping(bytes32 => ToolVersion) versions;
        Version latestVersion;
    }

    mapping(bytes32 => Tool) private tools;
    
    mapping(address =>  bytes32[]) private publisherTools;
    
    bytes32[] private allToolNames;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier toolExists(bytes32 name) {
        if (tools[name].owner == address(0)) revert ToolNotFound();
        _;
    }

    modifier onlyToolOwner(bytes32 name) {
        if (tools[name].owner != msg.sender) revert NotToolOwner();
        _;
    }
    
    modifier validVersion(Version memory version) {
        if (version.major == 0 && version.minor == 0 && version.patch == 0) revert InvalidVersion();
        _;
    }
    
    modifier validCidHash(bytes32 cidHash) {
        if (cidHash == bytes32(0)) revert EmptyCidHash();
        _;
    }
    
    modifier validMetadataHash(bytes32 metadataHash) {
        if (metadataHash == bytes32(0)) revert EmptyMetadataHash();
        _;
    }
    
    modifier versionMustExist(bytes32 name, Version memory version) {
        bytes32 versionHash = getVersionHash(version);
        if (tools[name].versions[versionHash].cidHash == bytes32(0)) revert VersionNotExists();
        _;
    }

    modifier checkNameHash(string memory name, bytes32 nameHash) {
        if (keccak256(bytes(name)) != nameHash) revert InvalidNameHash();
        _;
    }
    
    function getVersionHash(Version memory version) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(version.major, version.minor, version.patch));
    }
    
    function versionExists(bytes32 name, Version memory version) public view returns (bool) {
        if (tools[name].owner == address(0)) {
            return false;
        }
        bytes32 versionHash = getVersionHash(version);        
        return tools[name].versions[versionHash].cidHash != bytes32(0);
    }

    function isToolNameRegistered(bytes32 name) public view returns (bool) {
        return tools[name].owner != address(0);
    }
    
    function compareVersions(Version memory a, Version memory b) internal pure returns (int) {
        if (a.major > b.major) return 1;
        if (a.major < b.major) return -1;
        
        if (a.minor > b.minor) return 1;
        if (a.minor < b.minor) return -1;
        
        if (a.patch > b.patch) return 1;
        if (a.patch < b.patch) return -1;
        
        return 0;
    }

    function computeNameHash(string memory name) public pure returns (bytes32) {
        return keccak256(bytes(name));
    }

    function registerTool(
        string memory name,
        Version calldata version,
        bytes32 cidHash,
        bytes32 metadataHash
    ) external 
        validVersion(version) 
        validCidHash(cidHash) 
        validMetadataHash(metadataHash) 
    {
        bytes32 versionHash = getVersionHash(version);
        bytes32 nameHash = computeNameHash(name);
        if (tools[nameHash].owner == address(0)) {
            if (isToolNameRegistered(nameHash)) revert ToolNameAlreadyRegistered();

            tools[nameHash].owner = msg.sender;
            
            tools[nameHash].latestVersion = version;
            
            publisherTools[msg.sender].push(nameHash);
            allToolNames.push(nameHash);
            
            tools[nameHash].versions[versionHash] = ToolVersion(
                version,
                cidHash,
                block.timestamp,
                metadataHash
            );
            tools[nameHash].versionHashes.push(versionHash);
            
            emit ToolRegistered(name, version.major, version.minor, version.patch, cidHash, msg.sender, block.timestamp);
        } else {
            if (tools[nameHash].owner != msg.sender) revert NotToolOwner();
            
            if (versionExists(nameHash, version)) revert VersionAlreadyExists();
            
            if (compareVersions(version, tools[nameHash].latestVersion) <= 0) revert InvalidVersionOrder();
            
            tools[nameHash].versions[versionHash] = ToolVersion(
                version,
                cidHash,
                block.timestamp,
                metadataHash
            );
            tools[nameHash].versionHashes.push(versionHash);
            
            tools[nameHash].latestVersion = version;
            
            emit ToolUpdated(name, version.major, version.minor, version.patch, cidHash, msg.sender, block.timestamp);
        }
    }

    function updateToolMetadata(
        string memory name,
        bytes32 nameHash,
        Version calldata version,
        bytes32 metadataHash
    ) external 
        checkNameHash(name, nameHash)
        toolExists(nameHash) 
        onlyToolOwner(nameHash)
        validMetadataHash(metadataHash)
        versionMustExist(nameHash, version)
    {
        bytes32 versionHash = getVersionHash(version);
        
        tools[nameHash].versions[versionHash].metadataHash = metadataHash;
        
        emit ToolUpdated(
            name, 
            version.major,
            version.minor,
            version.patch,
            tools[nameHash].versions[versionHash].cidHash, 
            msg.sender, 
            block.timestamp
        );
    }

    function transferToolOwnership(
        string memory name, 
        bytes32 nameHash,
        address newOwner
    ) external toolExists(nameHash) onlyToolOwner(nameHash) {
        if (newOwner == address(0)) revert ZeroAddressNotAllowed();
        if (newOwner == msg.sender) revert SameOwner();
        
        address previousOwner = tools[nameHash].owner;
        tools[nameHash].owner = newOwner;
        
        for (uint i = 0; i < publisherTools[previousOwner].length; i++) {
            if (publisherTools[previousOwner][i] == nameHash) {
                if (i < publisherTools[previousOwner].length - 1) {
                    publisherTools[previousOwner][i] = publisherTools[previousOwner][publisherTools[previousOwner].length - 1];
                }
                publisherTools[previousOwner].pop();
                break;
            }
        }
        
        publisherTools[newOwner].push(nameHash);
        
        emit OwnershipTransferred(name, previousOwner, newOwner);
    }

    function getToolInfo(bytes32 name) 
        external 
        view 
        toolExists(name) 
        returns (address toolOwner, uint256 versionCount, Version memory latestVersion) 
    {
        return (
            tools[name].owner,
            tools[name].versionHashes.length,
            tools[name].latestVersion
        );
    }

    function getToolVersion(bytes32 name, Version calldata version) 
        external 
        view 
        toolExists(name)
        versionMustExist(name, version)
        returns (Version memory retrievedVersion, bytes32 cidHash, uint256 timestamp, bytes32 metadataHash) 
    {
        bytes32 versionHash = getVersionHash(version);
        
        ToolVersion storage toolVersion = tools[name].versions[versionHash];
        return (
            toolVersion.version,
            toolVersion.cidHash,
            toolVersion.timestamp,
            toolVersion.metadataHash
        );
    }

    function getToolVersions(bytes32 name) 
        external 
        view 
        toolExists(name) 
        returns (Version[] memory) 
    {
        bytes32[] storage versionHashes = tools[name].versionHashes;
        Version[] memory result = new Version[](versionHashes.length);
        
        for (uint256 i = 0; i < versionHashes.length; i++) {
            result[i] = tools[name].versions[versionHashes[i]].version;
        }
        
        return result;
    }

    function getPublisherToolsPaginated(address publisher, uint256 offset, uint256 limit) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        if (publisherTools[publisher].length == 0) {
            return new bytes32[](0);
        }
        
        if (offset >= publisherTools[publisher].length) revert OffsetOutOfBounds();
        
        uint256 size = (offset + limit > publisherTools[publisher].length) 
            ? publisherTools[publisher].length - offset 
            : limit;
            
        bytes32[] memory result = new bytes32[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = publisherTools[publisher][offset + i];
        }
        
        return result;
    }

    function getLatestVersion(bytes32 name) 
        external 
        view 
        toolExists(name) 
        returns (Version memory version, bytes32 cidHash, uint256 timestamp, bytes32 metadataHash) 
    {
        Version memory latestVersion = tools[name].latestVersion;
        bytes32 versionHash = getVersionHash(latestVersion);
        ToolVersion storage toolVersion = tools[name].versions[versionHash];
        
        return (
            toolVersion.version,
            toolVersion.cidHash,
            toolVersion.timestamp,
            toolVersion.metadataHash
        );
    }

    function transferContractOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddressNotAllowed();
        owner = newOwner;
    }

    function getAllToolsPaginated(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        if (allToolNames.length == 0) {
            return new bytes32[](0);
        }
        
        if (offset >= allToolNames.length) revert OffsetOutOfBounds();
        
        uint256 size = (offset + limit > allToolNames.length) 
            ? allToolNames.length - offset 
            : limit;
            
        bytes32[] memory result = new bytes32[](size);   
        for (uint256 i = 0; i < size; i++) {
            result[i] = allToolNames[offset + i];
        }
        
        return result;
    }
    
    function getToolCount() external view returns (uint256) {
        return allToolNames.length;
    }
} 