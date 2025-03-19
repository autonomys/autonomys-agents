const ABI = [
    'function registerTool(string memory name, string memory version, string memory cid, string memory metadata) external',
    'function updateToolMetadata(string memory name, string memory version, string memory metadata) external',
    'function setLatestVersion(string memory name, string memory version) external',
    'function getToolInfo(string memory name) external view returns (address toolOwner, uint256 versionCount, string memory latestVersion)',
    'function getToolVersion(string memory name, string memory version) external view returns (string memory cid, uint256 timestamp, string memory metadata)',
    'function getToolVersions(string memory name) external view returns (string[] memory)',
    'function getLatestVersion(string memory name) external view returns (string memory version, string memory cid, uint256 timestamp, string memory metadata)',
    'function getAllTools() external view returns (string[] memory)',
    'function getToolCount() external view returns (uint256)',
    'function versionExists(string memory name, string memory version) external view returns (bool)',
    'function transferToolOwnership(string memory name, address newOwner) external',
    'function transferContractOwnership(address newOwner) external',
    'function getPublisherTools(address publisher) external view returns (string[] memory)',
  
    'event ToolRegistered(string name, string version, string cid, address publisher, uint256 timestamp)',
    'event ToolUpdated(string name, string version, string cid, address publisher, uint256 timestamp)',
    'event OwnershipTransferred(string name, address previousOwner, address newOwner)',
  ];