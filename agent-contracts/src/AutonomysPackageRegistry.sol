// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
/**
*  _____                                                                                                            _____ 
* ( ___ )                                                                                                          ( ___ )
*  |   |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|   | 
*  |   |                                                                                                            |   | 
*  |   |                                                                                                            |   | 
*  |   |                                                                                                            |   | 
*  |   |        ___      __    __  .___________.  ______   .__   __.   ______   .___  ___. ____    ____  _______.   |   | 
*  |   |       /   \    |  |  |  | |           | /  __  \  |  \ |  |  /  __  \  |   \/   | \   \  /   / /       |   |   | 
*  |   |      /  ^  \   |  |  |  | `---|  |----`|  |  |  | |   \|  | |  |  |  | |  \  /  |  \   \/   / |   (----`   |   | 
*  |   |     /  /_\  \  |  |  |  |     |  |     |  |  |  | |  . `  | |  |  |  | |  |\/|  |   \_    _/   \   \       |   | 
*  |   |    /  _____  \ |  `--'  |     |  |     |  `--'  | |  |\   | |  `--'  | |  |  |  |     |  | .----)   |      |   | 
*  |   |   /__/     \__\ \______/      |__|      \______/  |__| \__|  \______/  |__|  |__|     |__| |_______/       |   | 
*  |   |                                                                                                            |   | 
*  |   |        ___       _______  _______ .__   __. .___________.                                                  |   | 
*  |   |       /   \     /  _____||   ____||  \ |  | |           |                                                  |   | 
*  |   |      /  ^  \   |  |  __  |  |__   |   \|  | `---|  |----`                                                  |   | 
*  |   |     /  /_\  \  |  | |_ | |   __|  |  . `  |     |  |                                                       |   | 
*  |   |    /  _____  \ |  |__| | |  |____ |  |\   |     |  |                                                       |   | 
*  |   |   /__/     \__\ \______| |_______||__| \__|     |__|                                                       |   | 
*  |   |                                                                                                            |   | 
*  |   |   .______      ___       ______  __  ___      ___       _______  _______                                   |   | 
*  |   |   |   _  \    /   \     /      ||  |/  /     /   \     /  _____||   ____|                                  |   | 
*  |   |   |  |_)  |  /  ^  \   |  ,----'|  '  /     /  ^  \   |  |  __  |  |__                                     |   | 
*  |   |   |   ___/  /  /_\  \  |  |     |    <     /  /_\  \  |  | |_ | |   __|                                    |   | 
*  |   |   |  |     /  _____  \ |  `----.|  .  \   /  _____  \ |  |__| | |  |____                                   |   | 
*  |   |   | _|    /__/     \__\ \______||__|\__\ /__/     \__\ \______| |_______|                                  |   | 
*  |   |                                                                                                            |   | 
*  |   |   .___  ___.      ___      .__   __.      ___       _______  _______ .______                               |   | 
*  |   |   |   \/   |     /   \     |  \ |  |     /   \     /  _____||   ____||   _  \                              |   | 
*  |   |   |  \  /  |    /  ^  \    |   \|  |    /  ^  \   |  |  __  |  |__   |  |_)  |                             |   | 
*  |   |   |  |\/|  |   /  /_\  \   |  . `  |   /  /_\  \  |  | |_ | |   __|  |      /                              |   | 
*  |   |   |  |  |  |  /  _____  \  |  |\   |  /  _____  \ |  |__| | |  |____ |  |\  \----.                         |   | 
*  |   |   |__|  |__| /__/     \__\ |__| \__| /__/     \__\ \______| |_______|| _| `._____|                         |   | 
*  |   |                                                                                                            |   | 
*  |   |   .______       _______   _______  __       _______.___________..______     ____    ____                   |   | 
*  |   |   |   _  \     |   ____| /  _____||  |     /       |           ||   _  \    \   \  /   /                   |   | 
*  |   |   |  |_)  |    |  |__   |  |  __  |  |    |   (----`---|  |----`|  |_)  |    \   \/   /                    |   | 
*  |   |   |      /     |   __|  |  | |_ | |  |     \   \       |  |     |      /      \_    _/                     |   | 
*  |   |   |  |\  \----.|  |____ |  |__| | |  | .----)   |      |  |     |  |\  \----.   |  |                       |   | 
*  |   |   | _| `._____||_______| \______| |__| |_______/       |__|     | _| `._____|   |__|                       |   | 
*  |   |                                                                                                            |   | 
*  |   |     ______   ______   .__   __. .___________..______          ___       ______ .___________.               |   | 
*  |   |    /      | /  __  \  |  \ |  | |           ||   _  \        /   \     /      ||           |               |   | 
*  |   |   |  ,----'|  |  |  | |   \|  | `---|  |----`|  |_)  |      /  ^  \   |  ,----'`---|  |----`               |   | 
*  |   |   |  |     |  |  |  | |  . `  |     |  |     |      /      /  /_\  \  |  |         |  |                    |   | 
*  |   |   |  `----.|  `--'  | |  |\   |     |  |     |  |\  \----./  _____  \ |  `----.    |  |                    |   | 
*  |   |    \______| \______/  |__| \__|     |__|     | _| `._____/__/     \__\ \______|    |__|                    |   | 
*  |   |                                                                                                            |   | 
*  |   |                                                                                                            |   | 
*  |   |                                                                                                            |   | 
*  |___|~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|___| 
* (_____)                                                                                                          (_____)
*/

/**
 * @title AutonomysPackageRegistry
 * @notice A registry contract for managing Autonomys tools and their versions
 * @dev This contract stores tool versions, their metadata, and ownership information
 */
contract AutonomysPackageRegistry {
    
    // Custom errors for efficient gas usage
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

    /// @notice Address of the contract owner
    address public owner;
   
    // Events emitted by the contract
    event ToolRegistered(string indexed name, uint256 major, uint256 minor, uint256 patch, bytes32 cidHash, address publisher, uint256 timestamp);
    event ToolUpdated(string indexed name, uint256 major, uint256 minor, uint256 patch, bytes32 cidHash, address publisher, uint256 timestamp);
    event OwnershipTransferred(string indexed name, address previousOwner, address newOwner);

    /// @notice Structure for semantic versioning
    struct Version {
        uint64 major;
        uint64 minor;
        uint64 patch;
    }

    /// @notice Structure for storing tool version information
    /// @dev cidHash and metadataHash are Blake3 hashes of the tool cid and the tool metadata cid
    struct ToolVersion {
        Version version;
        bytes32 cidHash;
        uint256 timestamp; 
        bytes32 metadataHash; 
    }

    /// @notice Structure for storing tool information
    struct Tool {
        address owner;
        bytes32[] versionHashes;
        mapping(bytes32 => ToolVersion) versions;
        Version latestVersion;
    }

    /// @notice Mapping from nameHash (keccak256) to Tool struct
    mapping(bytes32 => Tool) private tools;
    
    /// @notice Mapping from publisher address to array of tool nameHashes they own
    mapping(address =>  bytes32[]) private publisherTools;
    
    /// @notice Array of all tool nameHashes in the registry
    bytes32[] private allToolNames;

    /**
     * @notice Contract constructor
     * @dev Sets the deployer as the initial owner
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Restricts function access to contract owner only
     */
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    /**
     * @dev Verifies that a tool with the specified nameHash exists
     * @param nameHash keccak256 hash of the tool name
     */
    modifier toolExists(bytes32 nameHash) {
        if (tools[nameHash].owner == address(0)) revert ToolNotFound();
        _;
    }

    /**
     * @dev Restricts function access to the tool owner only
     * @param nameHash keccak256 hash of the tool name
     */
    modifier onlyToolOwner(bytes32 nameHash) {
        if (tools[nameHash].owner != msg.sender) revert NotToolOwner();
        _;
    }
    
    /**
     * @dev Validates that the version is not 0.0.0
     * @param version The version to validate
     */
    modifier validVersion(Version memory version) {
        if (version.major == 0 && version.minor == 0 && version.patch == 0) revert InvalidVersion();
        _;
    }
    
    /**
     * @dev Ensures the cidHash is not empty
     * @param cidHash Blake3 hash to validate
     */
    modifier validCidHash(bytes32 cidHash) {
        if (cidHash == bytes32(0)) revert EmptyCidHash();
        _;
    }
    
    /**
     * @dev Ensures the metadataHash is not empty
     * @param metadataHash Blake3 hash to validate
     */
    modifier validMetadataHash(bytes32 metadataHash) {
        if (metadataHash == bytes32(0)) revert EmptyMetadataHash();
        _;
    }
    
    /**
     * @dev Verifies that a tool version exists
     * @param nameHash keccak256 hash of the tool name
     * @param version Version to check
     */
    modifier versionMustExist(bytes32 nameHash, Version memory version) {
        bytes32 versionHash = getVersionHash(version);
        if (tools[nameHash].versions[versionHash].cidHash == bytes32(0)) revert VersionNotExists();
        _;
    }

    /**
     * @dev Validates that the provided nameHash matches the keccak256 hash of the name
     * @param name The tool name
     * @param nameHash Keccak256 hash of the tool name
     */
    modifier checkNameHash(string memory name, bytes32 nameHash) {
        if (keccak256(bytes(name)) != nameHash) revert InvalidNameHash();
        _;
    }
    
    /**
     * @notice Creates a hash from a version structure
     * @dev Used as a key in version mappings
     * @param version The version to hash
     * @return The keccak256 hash of the version
     */
    function getVersionHash(Version memory version) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(version.major, version.minor, version.patch));
    }
    
    /**
     * @notice Checks if a specific version of a tool exists
     * @param nameHash keccak256 hash of the tool name
     * @param version The version to check
     * @return bool True if the version exists
     */
    function versionExists(bytes32 nameHash, Version memory version) public view returns (bool) {
        if (tools[nameHash].owner == address(0)) {
            return false;
        }
        bytes32 versionHash = getVersionHash(version);        
        return tools[nameHash].versions[versionHash].cidHash != bytes32(0);
    }

    /**
     * @notice Checks if a tool name is already registered
     * @param nameHash keccak256 hash of the tool name
     * @return bool True if the tool name is registered
     */
    function isToolNameRegistered(bytes32 nameHash) public view returns (bool) {
        return tools[nameHash].owner != address(0);
    }
    
    /**
     * @notice Compares two versions according to semantic versioning
     * @dev Returns 1 if a > b, -1 if a < b, 0 if equal
     * @param a First version
     * @param b Second version
     * @return int Comparison result
     */
    function compareVersions(Version memory a, Version memory b) internal pure returns (int) {
        if (a.major > b.major) return 1;
        if (a.major < b.major) return -1;
        
        if (a.minor > b.minor) return 1;
        if (a.minor < b.minor) return -1;
        
        if (a.patch > b.patch) return 1;
        if (a.patch < b.patch) return -1;
        
        return 0;
    }

    /**
     * @notice Computes the keccak256 hash of a tool name
     * @param name The tool name to hash
     * @return bytes32 The keccak256 hash of the name
     */
    function computeNameHash(string memory name) public pure returns (bytes32) {
        return keccak256(bytes(name));
    }

    /**
     * @notice Registers a new tool or publishes a new version of an existing tool
     * @dev If tool doesn't exist, creates new entry; if it exists, adds new version
     * @param name Name of the tool
     * @param version Semantic version (major.minor.patch)
     * @param cidHash Blake3 hash of the tool content
     * @param metadataHash Blake3 hash of tool metadata
     */
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

    /**
     * @notice Updates the metadata for an existing tool version
     * @dev Only the tool owner can update metadata
     * @param name Tool name
     * @param nameHash keccak256 hash of the tool name
     * @param version Version of the tool to update
     * @param metadataHash New Blake3 hash of the tool metadata cid
     */
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

    /**
     * @notice Transfers ownership of a tool to a new address
     * @dev Updates relevant mappings to reflect the ownership change
     * @param name Tool name
     * @param nameHash keccak256 hash of the tool name
     * @param newOwner Address of the new owner
     */
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

    /**
     * @notice Gets basic information about a tool
     * @param name keccak256 hash of the tool name
     * @return toolOwner The address of the tool owner
     * @return versionCount The number of versions available
     * @return latestVersion The latest registered version
     */
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

    /**
     * @notice Gets detailed information about a specific tool version
     * @param name keccak256 hash of the tool name
     * @param version The version to retrieve
     * @return retrievedVersion The version structure
     * @return cidHash Blake3 hash of the tool cid
     * @return timestamp When the version was published
     * @return metadataHash Blake3 hash of the tool metadata cid
     */
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

    /**
     * @notice Gets all versions of a specific tool
     * @param name keccak256 hash of the tool name
     * @return Array of version structures
     */
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

    /**
     * @notice Gets a paginated list of tools published by a specific address
     * @param publisher Address of the publisher
     * @param offset Starting index for pagination
     * @param limit Maximum number of entries to return
     * @return Array of tool nameHashes (keccak256)
     */
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

    /**
     * @notice Gets information about the latest version of a tool
     * @param name keccak256 hash of the tool name
     * @return version The version structure
     * @return cidHash Blake3 hash of the tool cid
     * @return timestamp When the version was published
     * @return metadataHash Blake3 hash of the metadata cid
     */
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

    /**
     * @notice Transfers ownership of the entire contract
     * @dev Only callable by the current contract owner
     * @param newOwner Address of the new contract owner
     */
    function transferContractOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddressNotAllowed();
        owner = newOwner;
    }

    /**
     * @notice Gets a paginated list of all registered tools
     * @param offset Starting index for pagination
     * @param limit Maximum number of entries to return
     * @return Array of tool nameHashes (keccak256)
     */
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
    
    /**
     * @notice Gets the total number of registered tools
     * @return The count of registered tools
     */
    function getToolCount() external view returns (uint256) {
        return allToolNames.length;
    }
} 