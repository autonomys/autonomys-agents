// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AutonomysPackageRegistry {
    address public owner;
   
    event ToolRegistered(string name, string version, bytes32 cid, address publisher, uint256 timestamp);
    event ToolUpdated(string name, string version, bytes32 cid, address publisher, uint256 timestamp);
    event OwnershipTransferred(string name, address previousOwner, address newOwner);

    struct Version {
        uint256 major;
        uint256 minor;
        uint256 patch;
    }

    struct ToolVersion {
        string version;
        bytes32 cid;   
        uint256 timestamp; 
        bytes32 metadata;  
    }

    struct Tool {
        address owner;
        string[] versionList;
        mapping(string => ToolVersion) versions;
        string latestVersion;
    }

    mapping(string => Tool) private tools;
    
    mapping(address => string[]) private publisherTools;
    
    string[] private allToolNames;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier toolExists(string memory name) {
        require(tools[name].owner != address(0), "Tool does not exist");
        _;
    }

    modifier onlyToolOwner(string memory name) {
        require(tools[name].owner == msg.sender, "Caller is not the tool owner");
        _;
    }
    
    function validateToolName(string memory name) internal pure {
        bytes memory nameBytes = bytes(name);
        require(nameBytes.length > 0, "Tool name cannot be empty");
    }
    
    function validateVersion(string memory version) internal pure {
        bytes memory versionBytes = bytes(version);
        require(versionBytes.length > 0, "Version cannot be empty");
        
        if (keccak256(versionBytes) == keccak256(bytes("0.0.0"))) {
            revert("Version 0.0.0 is not permitted");
        }
    }
    
    function validateCID(bytes32 cid) internal pure {
        require(cid != bytes32(0), "CID cannot be empty");
    }
    
    function validateMetadata(bytes32 metadata) internal pure {
        require(metadata != bytes32(0), "Metadata cannot be empty");
    }

    function versionExists(string memory name, string memory version) public view returns (bool) {
        if (tools[name].owner == address(0)) {
            return false;
        }        
        return tools[name].versions[version].cid != bytes32(0);
    }

    function isToolNameRegistered(string memory name) public view returns (bool) {
        return tools[name].owner != address(0);
    }

    function parseVersion(string memory version) public pure returns (Version memory) {
        Version memory result;
        bytes memory versionBytes = bytes(version);
        uint256 versionLength = versionBytes.length;
        
        uint256 firstDot = 0;
        while (firstDot < versionLength && versionBytes[firstDot] != ".") {
            firstDot++;
        }
        
        if (firstDot > 0) {
            result.major = parseVersionComponent(versionBytes, 0, firstDot);
        }
        
        uint256 secondDot = firstDot + 1;
        while (secondDot < versionLength && versionBytes[secondDot] != ".") {
            secondDot++;
        }
        
        if (secondDot > firstDot + 1) {
            result.minor = parseVersionComponent(versionBytes, firstDot + 1, secondDot);
        }
        
        if (secondDot < versionLength - 1) {
            result.patch = parseVersionComponent(versionBytes, secondDot + 1, versionLength);
        }

        require(result.major > 0 || result.minor > 0 || result.patch > 0, "Version 0.0.0 is not permitted");
        
        return result;
    }
    
    function parseVersionComponent(bytes memory versionBytes, uint256 start, uint256 end) 
        private 
        pure 
        returns (uint256) 
    {
        uint256 value = 0;
        for (uint256 i = start; i < end; i++) {
            uint8 digit = uint8(versionBytes[i]) - 48;
            require(digit <= 9, "Invalid version character");
            value = value * 10 + digit;
        }
        return value;
    }
    
    function compareVersions(string memory a, string memory b) public pure returns (int) {
        Version memory vA = parseVersion(a);
        Version memory vB = parseVersion(b);
        
        if (vA.major > vB.major) return 1;
        if (vA.major < vB.major) return -1;
        
        if (vA.minor > vB.minor) return 1;
        if (vA.minor < vB.minor) return -1;
        
        if (vA.patch > vB.patch) return 1;
        if (vA.patch < vB.patch) return -1;
        
        return 0;
    }

    function registerTool(
        string memory name,
        string memory version,
        bytes32 cid,
        bytes32 metadata
    ) external {
        validateToolName(name);
        validateVersion(version);
        validateCID(cid);
        validateMetadata(metadata);

        if (tools[name].owner == address(0)) {
            require(!isToolNameRegistered(name), "Tool name already registered");

            tools[name].owner = msg.sender;
            
            tools[name].latestVersion = version;
            
            publisherTools[msg.sender].push(name);
            allToolNames.push(name);
            
            tools[name].versions[version] = ToolVersion(
                version,
                cid,
                block.timestamp,
                metadata
            );
            tools[name].versionList.push(version);
            
            emit ToolRegistered(name, version, cid, msg.sender, block.timestamp);
        } else {
            require(tools[name].owner == msg.sender, "Not the tool owner");
            
            require(!versionExists(name, version), "Version already exists");
            
            require(compareVersions(version, tools[name].latestVersion) > 0, 
                "New version must be higher than the latest version");
            
            tools[name].versions[version] = ToolVersion(
                version,
                cid,
                block.timestamp,
                metadata
            );
            tools[name].versionList.push(version);
            
            tools[name].latestVersion = version;
            
            emit ToolUpdated(name, version, cid, msg.sender, block.timestamp);
        }
    }

    function updateToolMetadata(
        string memory name,
        string memory version, 
        bytes32 metadata
    ) external toolExists(name) onlyToolOwner(name) {
        require(versionExists(name, version), "Version does not exist");
        
        validateMetadata(metadata);
        
        tools[name].versions[version].metadata = metadata;
        
        emit ToolUpdated(
            name, 
            version, 
            tools[name].versions[version].cid, 
            msg.sender, 
            block.timestamp
        );
    }

    function transferToolOwnership(
        string memory name, 
        address newOwner
    ) external toolExists(name) onlyToolOwner(name) {
        require(newOwner != address(0), "New owner cannot be zero address");
        require(newOwner != msg.sender, "New owner cannot be the same as current");
        
        address previousOwner = tools[name].owner;
        tools[name].owner = newOwner;
        
        for (uint i = 0; i < publisherTools[previousOwner].length; i++) {
            if (keccak256(bytes(publisherTools[previousOwner][i])) == keccak256(bytes(name))) {
                if (i < publisherTools[previousOwner].length - 1) {
                    publisherTools[previousOwner][i] = publisherTools[previousOwner][publisherTools[previousOwner].length - 1];
                }
                publisherTools[previousOwner].pop();
                break;
            }
        }
        
        publisherTools[newOwner].push(name);
        
        emit OwnershipTransferred(name, previousOwner, newOwner);
    }

    function getToolInfo(string memory name) 
        external 
        view 
        toolExists(name) 
        returns (address toolOwner, uint256 versionCount, string memory latestVersion) 
    {
        return (
            tools[name].owner,
            tools[name].versionList.length,
            tools[name].latestVersion
        );
    }

    function getToolVersion(string memory name, string memory version) 
        external 
        view 
        toolExists(name) 
        returns (bytes32 cid, uint256 timestamp, bytes32 metadata) 
    {
        require(versionExists(name, version), "Version does not exist");
        
        ToolVersion storage toolVersion = tools[name].versions[version];
        return (
            toolVersion.cid,
            toolVersion.timestamp,
            toolVersion.metadata
        );
    }

    function getToolVersions(string memory name) 
        external 
        view 
        toolExists(name) 
        returns (string[] memory) 
    {
        return tools[name].versionList;
    }

    function getPublisherTools(address publisher, uint256 offset, uint256 limit) 
        external 
        view 
        returns (string[] memory) 
    {
        if (publisherTools[publisher].length > 0) {
            require(offset < publisherTools[publisher].length, "Offset out of bounds");
        }
        
        if (publisherTools[publisher].length == 0 || offset >= publisherTools[publisher].length) {
            return new string[](0);
        }
        
        uint256 size = (offset + limit > publisherTools[publisher].length) 
            ? publisherTools[publisher].length - offset 
            : limit;
            
        string[] memory result = new string[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = publisherTools[publisher][offset + i];
        }
        
        return result;
    }

    function getLatestVersion(string memory name) 
        external 
        view 
        toolExists(name) 
        returns (string memory version, bytes32 cid, uint256 timestamp, bytes32 metadata) 
    {
        string memory latestVersionStr = tools[name].latestVersion;
        ToolVersion storage toolVersion = tools[name].versions[latestVersionStr];
        
        return (
            toolVersion.version,
            toolVersion.cid,
            toolVersion.timestamp,
            toolVersion.metadata
        );
    }

    function transferContractOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }

    function getAllTools(uint256 offset, uint256 limit) external view returns (string[] memory) {
        if (allToolNames.length > 0) {
            require(offset < allToolNames.length, "Offset out of bounds");
        }
        
        if (allToolNames.length == 0 || offset >= allToolNames.length) {
            return new string[](0);
        }
        
        uint256 size = (offset + limit > allToolNames.length) 
            ? allToolNames.length - offset 
            : limit;
            
        string[] memory result = new string[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = allToolNames[offset + i];
        }
        
        return result;
    }
    
    function getToolCount() external view returns (uint256) {
        return allToolNames.length;
    }
} 