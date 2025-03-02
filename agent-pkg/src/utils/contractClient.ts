import { ethers } from 'ethers';
import { initializeConfigAndCredentials, getCredentials } from './config.js';
import chalk from 'chalk';

// ABI for AutonomysPackageRegistry
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

/**
 * Initialize a contract instance for the AutonomysPackageRegistry
 * @returns An ethers.js Contract instance
 */
export async function getRegistryContract(readOnly: boolean = false) {
  try {
    const { config, credentials, getCredentials } = await initializeConfigAndCredentials();
    const rpcUrl = config.taurusRpcUrl;
    const contractAddress = config.packageRegistryAddress;

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    if (readOnly) {
      return new ethers.Contract(contractAddress, ABI, provider);
    } else {
      let privateKey: string | undefined;

      if (credentials.autoEvmPrivateKey) {
        privateKey = credentials.autoEvmPrivateKey;
      } else {
        console.log(
          chalk.yellow('Private key not found. Blockchain operation requires authentication.'),
        );
      }

      if (!privateKey) {
        throw new Error('Auto-EVM private key is required for this operation');
      }

      const wallet = new ethers.Wallet(privateKey, provider);
      return new ethers.Contract(contractAddress, ABI, wallet);
    }
  } catch (error) {
    console.error('Error initializing contract instance:', error);
    throw error;
  }
}

/**
 * Register a new tool in the AutonomysPackageRegistry
 * @param name Tool name
 * @param cid Content identifier
 * @param version Version string
 * @param metadata Additional metadata (description, keywords, etc.)
 * @returns Transaction hash
 */
export async function registerTool(
  name: string,
  cid: string,
  version: string,
  metadata: string = '{}',
): Promise<string> {
  try {
    const contract = await getRegistryContract();
    const tx = await contract.registerTool(name, version, cid, metadata);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error(`Error registering tool ${name}:`, error);
    throw error;
  }
}

/**
 * Add a new version for an existing tool
 * @param name Tool name
 * @param cid Content identifier
 * @param version Version string
 * @param metadata Additional metadata (description, keywords, etc.)
 * @returns Transaction hash
 */
export async function addToolVersion(
  name: string,
  cid: string,
  version: string,
  metadata: string = '{}',
): Promise<string> {
  try {
    const contract = await getRegistryContract();

    if (!(await isToolOwner(name))) {
      throw new Error(`You are not the owner of tool '${name}'`);
    }

    const tx = await contract.registerTool(name, version, cid, metadata);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error(`Error adding version ${version} for tool ${name}:`, error);
    throw error;
  }
}

/**
 * Get information about a tool
 * @param name Tool name
 * @returns Tool information including owner, version count, and latest version
 */
export async function getToolInfo(name: string): Promise<{
  owner: string;
  versionCount: number;
  latestVersion: string;
}> {
  try {
    const contract = await getRegistryContract(true);
    const [owner, versionCount, latestVersion] = await contract.getToolInfo(name);
    return { owner, versionCount: Number(versionCount), latestVersion };
  } catch (error) {
    console.error(`Error getting info for tool ${name}:`, error);
    throw error;
  }
}

/**
 * Get information about a specific version of a tool
 * @param name Tool name
 * @param version Version string
 * @returns Version information including CID, timestamp, and metadata
 */
export async function getToolVersion(
  name: string,
  version: string,
): Promise<{
  cid: string;
  timestamp: number;
  metadata: string;
}> {
  try {
    const contract = await getRegistryContract(true);
    const [cid, timestamp, metadata] = await contract.getToolVersion(name, version);
    return { cid, timestamp: Number(timestamp), metadata };
  } catch (error) {
    console.error(`Error getting version ${version} for tool ${name}:`, error);
    throw error;
  }
}

/**
 * Get all versions of a tool
 * @param name Tool name
 * @returns Array of version strings
 */
export async function getToolVersions(name: string): Promise<string[]> {
  try {
    const contract = await getRegistryContract(true);
    return await contract.getToolVersions(name);
  } catch (error) {
    console.error(`Error getting versions for tool ${name}:`, error);
    throw error;
  }
}

/**
 * Get the latest version information for a tool
 * @param name Tool name
 * @returns Latest version information
 */
export async function getLatestToolVersion(name: string): Promise<{
  version: string;
  cid: string;
  timestamp: number;
  metadata: string;
}> {
  try {
    const contract = await getRegistryContract(true);
    const result = await contract.getLatestVersion(name);
    // Correct order for the returned values based on our logs:
    // result[0] = version
    // result[1] = CID
    // result[2] = timestamp
    // result[3] = metadata
    const version = result[0];
    const cid = result[1];
    const timestamp = Number(result[2]);
    const metadata = result[3];
    return {
      version,
      cid,
      timestamp,
      metadata,
    };
  } catch (error) {
    console.error(`Error getting latest version for tool ${name}:`, error);
    throw error;
  }
}

/**
 * Get all registered tool names
 * @returns Array of tool names
 */
export async function getAllToolNames(): Promise<string[]> {
  try {
    const contract = await getRegistryContract(true);
    return await contract.getAllTools();
  } catch (error) {
    console.error('Error getting all tool names:', error);
    throw error;
  }
}

/**
 * Check if the connected account is the owner of a tool
 * @param name Tool name
 * @returns Boolean indicating ownership
 */
export async function isToolOwner(name: string): Promise<boolean> {
  try {
    const { credentials, getCredentials } = await initializeConfigAndCredentials();
    let privateKey: string | undefined;

    if (credentials.autoEvmPrivateKey) {
      privateKey = credentials.autoEvmPrivateKey;
    } else {
      const newCredentials = await getCredentials();
      privateKey = newCredentials.autoEvmPrivateKey;
    }

    if (!privateKey) {
      return false;
    }

    const provider = new ethers.JsonRpcProvider(
      (await initializeConfigAndCredentials()).config.taurusRpcUrl,
    );
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = await wallet.getAddress();

    try {
      const toolInfo = await getToolInfo(name);
      return toolInfo.owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      return false;
    }
  } catch (error) {
    console.error(`Error checking ownership for tool ${name}:`, error);
    return false;
  }
}
