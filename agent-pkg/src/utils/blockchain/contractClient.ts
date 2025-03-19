import { ethers } from 'ethers';
import { initializeConfigAndCredentials } from '../../config/index.js';
import chalk from 'chalk';
import { ABI } from './contractABI.js';

/**
 * Initialize a contract instance for the AutonomysPackageRegistry
 * @returns An ethers.js Contract instance
 */
export const getRegistryContract = async (readOnly: boolean = false) => {
  try {
    const { config, credentials } = await initializeConfigAndCredentials();
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
};

/**
 * Register a new tool in the AutonomysPackageRegistry
 * @param name Tool name
 * @param cid Content identifier
 * @param version Version string
 * @param metadata Additional metadata (description, keywords, etc.)
 * @returns Transaction hash
 */
export const registerTool = async (
  name: string,
  cid: string,
  version: string,
  metadata: string = '{}',
): Promise<string> => {
  try {
    const contract = await getRegistryContract();
    const tx = await contract.registerTool(name, version, cid, metadata);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error(`Error registering tool ${name}:`, error);
    throw error;
  }
};

/**
 * Add a new version for an existing tool
 * @param name Tool name
 * @param cid Content identifier
 * @param version Version string
 * @param metadata Additional metadata (description, keywords, etc.)
 * @returns Transaction hash
 */
export const addToolVersion = async (
  name: string,
  cid: string,
  version: string,
  metadata: string = '{}',
): Promise<string> => {
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
};

/**
 * Get information about a tool
 * @param name Tool name
 * @returns Tool information including owner, version count, and latest version
 */
export const getToolInfo = async (
  name: string,
): Promise<{
  owner: string;
  versionCount: number;
  latestVersion: string;
}> => {
  try {
    const contract = await getRegistryContract(true);
    const [owner, versionCount, latestVersion] = await contract.getToolInfo(name);
    return {
      owner,
      versionCount: Number(versionCount),
      latestVersion,
    };
  } catch (error) {
    console.error(`Error getting info for tool ${name}:`, error);
    throw error;
  }
};

/**
 * Get information about a specific version of a tool
 * @param name Tool name
 * @param version Version string
 * @returns Version information including CID, timestamp, and metadata
 */
export const getToolVersion = async (
  name: string,
  version: string,
): Promise<{
  cid: string;
  timestamp: number;
  metadata: string;
}> => {
  try {
    const contract = await getRegistryContract(true);
    const [cid, timestamp, metadata] = await contract.getToolVersion(name, version);
    return { cid, timestamp: Number(timestamp), metadata };
  } catch (error) {
    console.error(`Error getting version ${version} for tool ${name}:`, error);
    throw error;
  }
};

/**
 * Get all versions of a tool
 * @param name Tool name
 * @returns Array of version strings
 */
export const getToolVersions = async (name: string): Promise<string[]> => {
  try {
    const contract = await getRegistryContract(true);
    return await contract.getToolVersions(name);
  } catch (error) {
    console.error(`Error getting versions for tool ${name}:`, error);
    throw error;
  }
};

/**
 * Get the latest version information for a tool
 * @param name Tool name
 * @returns Latest version information
 */
export const getLatestToolVersion = async (
  name: string,
): Promise<{
  version: string;
  cid: string;
  timestamp: number;
  metadata: string;
}> => {
  try {
    const contract = await getRegistryContract(true);
    const result = await contract.getLatestVersion(name);
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
};

/**
 * Get all registered tool names
 * @returns Array of tool names
 */
export const getAllToolNames = async (): Promise<string[]> => {
  try {
    const contract = await getRegistryContract(true);
    return await contract.getAllTools();
  } catch (error) {
    console.error('Error getting all tool names:', error);
    throw error;
  }
};

/**
 * Check if the connected account is the owner of a tool
 * @param name Tool name
 * @returns Boolean indicating ownership
 */
export const isToolOwner = async (name: string): Promise<boolean> => {
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
};
