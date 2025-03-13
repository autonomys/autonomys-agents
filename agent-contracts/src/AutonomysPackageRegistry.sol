// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AutonomysPackageRegistry
 * @dev Smart contract for managing tool package registrations on Autonomys DSN
 */
contract AutonomysPackageRegistry {
    address public owner;

    // Events
    event ToolRegistered(string name, string version, string cid, address publisher, uint256 timestamp);
    event ToolUpdated(string name, string version, string cid, address publisher, uint256 timestamp);
    event OwnershipTransferred(string name, address previousOwner, address newOwner);

    // Tool version struct
    struct ToolVersion {
        string version;     // Semantic version
        string cid;         // Content ID on Autonomys DSN
        uint256 timestamp;  // Publication timestamp
        string metadata;    // JSON string with additional metadata (description, keywords, etc.)
    }

    // Tool struct
    struct Tool {
        address owner;              // Tool owner address
        string[] versionList;       // List of all versions
        mapping(string => ToolVersion) versions;  // Version string => ToolVersion
        string latestVersion;       // Latest version string
        bool exists;                // Whether the tool exists
    }

    // Tool name => Tool
    mapping(string => Tool) private tools;
    
    // Publisher address => array of tool names
    mapping(address => string[]) private publisherTools;
    
    // Array of all registered tool names
    string[] private allToolNames;

    /**
     * @dev Constructor
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Modifier to check if sender is the contract owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /**
     * @dev Modifier to check if a tool exists
     */
    modifier toolExists(string memory name) {
        require(tools[name].exists, "Tool does not exist");
        _;
    }

    /**
     * @dev Modifier to check if sender is the tool owner
     */
    modifier onlyToolOwner(string memory name) {
        require(tools[name].owner == msg.sender, "Caller is not the tool owner");
        _;
    }

    /**
     * @dev Register a new tool
     * @param name Tool name
     * @param version Tool version
     * @param cid Content ID on Autonomys DSN
     * @param metadata Additional metadata as JSON string
     */
    function registerTool(
        string memory name,
        string memory version,
        string memory cid,
        string memory metadata
    ) external {
        // Check for empty values
        require(bytes(name).length > 0, "Tool name cannot be empty");
        require(bytes(version).length > 0, "Version cannot be empty");
        require(bytes(cid).length > 0, "CID cannot be empty");

        // New tool
        if (!tools[name].exists) {
            tools[name].owner = msg.sender;
            tools[name].exists = true;
            tools[name].latestVersion = version;
            
            // Add to publisher's tools
            publisherTools[msg.sender].push(name);
            
            // Add to the global list of all tools
            allToolNames.push(name);
            
            emit ToolRegistered(name, version, cid, msg.sender, block.timestamp);
        } else {
            // Updating existing tool
            require(tools[name].owner == msg.sender, "Not the tool owner");
            tools[name].latestVersion = version;
            
            emit ToolUpdated(name, version, cid, msg.sender, block.timestamp);
        }

        // Store version
        if (versionExists(name, version)) {
            // Update existing version
            tools[name].versions[version].cid = cid;
            tools[name].versions[version].timestamp = block.timestamp;
            tools[name].versions[version].metadata = metadata;
        } else {
            // Add new version
            tools[name].versions[version] = ToolVersion(
                version,
                cid,
                block.timestamp,
                metadata
            );
            tools[name].versionList.push(version);
        }
    }

    /**
     * @dev Update tool metadata without creating a new version
     * @param name Tool name
     * @param version Tool version
     * @param metadata New metadata
     */
    function updateToolMetadata(
        string memory name,
        string memory version, 
        string memory metadata
    ) external toolExists(name) onlyToolOwner(name) {
        require(versionExists(name, version), "Version does not exist");
        
        tools[name].versions[version].metadata = metadata;
        
        emit ToolUpdated(
            name, 
            version, 
            tools[name].versions[version].cid, 
            msg.sender, 
            block.timestamp
        );
    }

    /**
     * @dev Set the latest version of a tool
     * @param name Tool name
     * @param version Version to set as latest
     */
    function setLatestVersion(
        string memory name, 
        string memory version
    ) external toolExists(name) onlyToolOwner(name) {
        require(versionExists(name, version), "Version does not exist");
        
        tools[name].latestVersion = version;
        
        emit ToolUpdated(
            name, 
            version, 
            tools[name].versions[version].cid, 
            msg.sender, 
            block.timestamp
        );
    }

    /**
     * @dev Transfer ownership of a tool
     * @param name Tool name
     * @param newOwner Address of new owner
     */
    function transferToolOwnership(
        string memory name, 
        address newOwner
    ) external toolExists(name) onlyToolOwner(name) {
        require(newOwner != address(0), "New owner cannot be zero address");
        require(newOwner != msg.sender, "New owner cannot be the same as current");
        
        address previousOwner = tools[name].owner;
        tools[name].owner = newOwner;
        
        // Update publisher arrays
        bool found = false;
        
        // Remove from previous owner's list
        for (uint i = 0; i < publisherTools[previousOwner].length; i++) {
            if (keccak256(bytes(publisherTools[previousOwner][i])) == keccak256(bytes(name))) {
                // Replace with the last element then pop
                if (i < publisherTools[previousOwner].length - 1) {
                    publisherTools[previousOwner][i] = publisherTools[previousOwner][publisherTools[previousOwner].length - 1];
                }
                publisherTools[previousOwner].pop();
                found = true;
                break;
            }
        }
        
        // Add to new owner's list
        publisherTools[newOwner].push(name);
        
        emit OwnershipTransferred(name, previousOwner, newOwner);
    }

    /**
     * @dev Check if version exists
     * @param name Tool name
     * @param version Version to check
     */
    function versionExists(string memory name, string memory version) public view returns (bool) {
        if (!tools[name].exists) {
            return false;
        }
        
        return bytes(tools[name].versions[version].cid).length > 0;
    }

    /**
     * @dev Get tool information
     * @param name Tool name
     * @return toolOwner Owner address
     * @return versionCount Number of versions
     * @return latestVersion Latest version string
     */
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

    /**
     * @dev Get tool version information
     * @param name Tool name
     * @param version Version to get
     * @return cid Content ID
     * @return timestamp Publication timestamp
     * @return metadata Additional metadata
     */
    function getToolVersion(string memory name, string memory version) 
        external 
        view 
        toolExists(name) 
        returns (string memory cid, uint256 timestamp, string memory metadata) 
    {
        require(versionExists(name, version), "Version does not exist");
        
        ToolVersion storage toolVersion = tools[name].versions[version];
        return (
            toolVersion.cid,
            toolVersion.timestamp,
            toolVersion.metadata
        );
    }

    /**
     * @dev Get all versions of a tool
     * @param name Tool name
     * @return List of version strings
     */
    function getToolVersions(string memory name) 
        external 
        view 
        toolExists(name) 
        returns (string[] memory) 
    {
        return tools[name].versionList;
    }

    /**
     * @dev Get a list of tools owned by a publisher
     * @param publisher Publisher address
     * @return Array of tool names
     */
    function getPublisherTools(address publisher) 
        external 
        view 
        returns (string[] memory) 
    {
        return publisherTools[publisher];
    }

    /**
     * @dev Get latest version information for a tool
     * @param name Tool name
     * @return version Latest version
     * @return cid Content ID
     * @return timestamp Publication timestamp
     * @return metadata Additional metadata
     */
    function getLatestVersion(string memory name) 
        external 
        view 
        toolExists(name) 
        returns (string memory version, string memory cid, uint256 timestamp, string memory metadata) 
    {
        string memory latestVersion = tools[name].latestVersion;
        ToolVersion storage toolVersion = tools[name].versions[latestVersion];
        
        return (
            toolVersion.version,
            toolVersion.cid,
            toolVersion.timestamp,
            toolVersion.metadata
        );
    }

    /**
     * @dev Transfer contract ownership
     * @param newOwner Address of new contract owner
     */
    function transferContractOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }

    /**
     * @dev Get all registered tool names
     * @return Array of all tool names
     */
    function getAllTools() external view returns (string[] memory) {
        return allToolNames;
    }
    
    /**
     * @dev Get the total number of registered tools
     * @return Total count of registered tools
     */
    function getToolCount() external view returns (uint256) {
        return allToolNames.length;
    }
} 