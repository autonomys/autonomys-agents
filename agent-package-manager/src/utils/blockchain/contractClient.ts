import { ethers } from 'ethers';
import { loadConfig } from '../../config/index.js';
import { loadCredentials } from '../credential/index.js';
import chalk from 'chalk';
import { getHashFromCid } from './utils.js';
import AutonomysPackageRegistry from './AutonomysPackageRegistry.abi.json' with { type: 'json' };
import { getWalletAddress } from './utils.js';
import {
  Version,
  ContractError,
  ToolInfo,
  ToolVersionInfo,
  ToolLatestVersionInfo,
  isCustomError,
  getCustomErrorFromData,
} from './types.js';

// Convert string version to Version struct
function parseVersion(versionStr: string): Version {
  const [major, minor, patch] = versionStr.split('.').map(Number);
  return { major, minor, patch };
}

// Compute nameHash from string using keccak256
function computeNameHash(name: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(name));
}

// Convert Version struct to string
function versionToString(version: Version): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

const getRegistryContract = async (readOnly: boolean = false) => {
  try {
    const config = await loadConfig();
    const credentials = await loadCredentials();
    const rpcUrl = config.taurusRpcUrl;
    const contractAddress = config.packageRegistryAddress;
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    if (readOnly) {
      return new ethers.Contract(contractAddress, AutonomysPackageRegistry, provider);
    } else {
      const privateKey = credentials.autoEvmPrivateKey ?? credentials.autoEvmPrivateKey;

      if (!privateKey) {
        console.log(
          chalk.yellow('Private key not found. Blockchain operation requires authentication.'),
        );
        throw new Error('Auto-EVM private key is required for this operation');
      }

      const wallet = new ethers.Wallet(privateKey, provider);
      return new ethers.Contract(contractAddress, AutonomysPackageRegistry, wallet);
    }
  } catch (error) {
    console.error('Error initializing contract instance:', error);
    throw error;
  }
};

const registerTool = async (
  name: string,
  cid: string,
  version: string,
  metadataCid: string,
): Promise<string> => {
  try {
    const contract = await getRegistryContract();

    const versionObj = parseVersion(version);
    const cidHash = getHashFromCid(cid);
    const metadataHash = getHashFromCid(metadataCid);

    const tx = await contract.registerTool(name, versionObj, cidHash, metadataHash);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error: unknown) {
    const contractError = error as ContractError;

    // General error handling with our utility functions
    const customError = getCustomErrorFromData(contractError);

    if (isCustomError(contractError, 'VersionAlreadyExists')) {
      console.error(chalk.red(`Version ${version} already exists for tool ${name}.`));
      throw new Error(`Version ${version} already exists for tool ${name}.`);
    }

    if (isCustomError(contractError, 'ToolNameAlreadyRegistered')) {
      console.error(chalk.red(`Tool name ${name} is already registered by another owner.`));
      throw new Error(`Tool name ${name} is already registered by another owner.`);
    }

    if (isCustomError(contractError, 'InvalidVersionOrder')) {
      console.error(
        chalk.red(`Version ${version} must be greater than the latest registered version.`),
      );
      throw new Error(`Version ${version} must be greater than the latest registered version.`);
    }

    // Handle other errors
    if (customError) {
      console.error(chalk.red(`Contract error: ${customError}`));
      throw new Error(`Contract error: ${customError}`);
    }

    // console.error(`Error registering tool ${name}:`, error);
    throw error;
  }
};

const getToolInfo = async (name: string): Promise<ToolInfo | null> => {
  try {
    const contract = await getRegistryContract(true);
    const nameHash = computeNameHash(name);
    const [owner, versionCount, latestVersion] = await contract.getToolInfo(nameHash);

    return {
      owner,
      versionCount: Number(versionCount),
      latestVersion: versionToString(latestVersion),
    };
  } catch (error: unknown) {
    const contractError = error as ContractError;
    const customError = getCustomErrorFromData(contractError);

    // Return null for Tool does not exist errors
    if (
      isCustomError(contractError, 'Tool does not exist') ||
      contractError.code === 'CALL_EXCEPTION'
    ) {
      return null;
    }

    if (customError) {
      console.error(chalk.red(`Contract error: ${customError}`));
      throw new Error(`Contract error: ${customError}`);
    }

    console.error(`Error getting info for tool ${name}:`, error);
    throw error;
  }
};

const getToolVersion = async (name: string, version: string): Promise<ToolVersionInfo> => {
  try {
    const contract = await getRegistryContract(true);
    const nameHash = computeNameHash(name);
    const versionObj = parseVersion(version);

    const [retrievedVersion, cidHash, timestamp, metadataHash] = await contract.getToolVersion(
      nameHash,
      versionObj,
    );

    return {
      cid: cidHash,
      timestamp: Number(timestamp),
      metadataCid: metadataHash,
    };
  } catch (error: unknown) {
    const contractError = error as ContractError;
    const customError = getCustomErrorFromData(contractError);

    if (isCustomError(contractError, 'Tool does not exist')) {
      console.error(chalk.red(`Tool ${name} does not exist`));
      throw new Error(`Tool ${name} does not exist`);
    }

    if (isCustomError(contractError, 'VersionNotExists')) {
      console.error(chalk.red(`Version ${version} does not exist for tool ${name}`));
      throw new Error(`Version ${version} does not exist for tool ${name}`);
    }

    if (customError) {
      console.error(chalk.red(`Contract error: ${customError}`));
      throw new Error(`Contract error: ${customError}`);
    }

    console.error(`Error getting version ${version} for tool ${name}:`, error);
    throw error;
  }
};

const getToolVersions = async (name: string): Promise<string[]> => {
  try {
    const contract = await getRegistryContract(true);
    const nameHash = computeNameHash(name);
    const versions = await contract.getToolVersions(nameHash);

    const versionStrings = versions.map((v: Version) => `${v.major}.${v.minor}.${v.patch}`);
    console.log(chalk.green(`Found ${versionStrings.length} versions for tool ${name}`));
    return versionStrings;
  } catch (error: unknown) {
    const contractError = error as ContractError;
    const customError = getCustomErrorFromData(contractError);

    if (isCustomError(contractError, 'Tool does not exist')) {
      console.error(chalk.red(`Tool ${name} does not exist`));
      throw new Error(`Tool ${name} does not exist`);
    }

    if (customError) {
      console.error(chalk.red(`Contract error: ${customError}`));
      throw new Error(`Contract error: ${customError}`);
    }

    console.error(`Error getting versions for tool ${name}:`, error);
    throw error;
  }
};

const getLatestToolVersion = async (name: string): Promise<ToolLatestVersionInfo> => {
  try {
    const contract = await getRegistryContract(true);
    const nameHash = computeNameHash(name);
    const [versionObj, cidHash, timestamp, metadataHash] =
      await contract.getLatestVersion(nameHash);

    return {
      version: versionToString(versionObj),
      cid: cidHash,
      timestamp: Number(timestamp),
      metadataCid: metadataHash,
    };
  } catch (error: unknown) {
    const contractError = error as ContractError;
    const customError = getCustomErrorFromData(contractError);

    if (isCustomError(contractError, 'Tool does not exist')) {
      console.error(chalk.red(`Tool ${name} does not exist`));
      throw new Error(`Tool ${name} does not exist`);
    }

    if (customError) {
      console.error(chalk.red(`Contract error: ${customError}`));
      throw new Error(`Contract error: ${customError}`);
    }

    console.error(`Error getting latest version for tool ${name}:`, error);
    throw error;
  }
};

const getAllToolNameHashes = async (offset: number = 0, limit: number = 100): Promise<string[]> => {
  try {
    console.log(
      chalk.blue(`Getting all tool name hashes with offset ${offset} and limit ${limit}`),
    );
    const contract = await getRegistryContract(true);
    const safeOffset = Math.max(0, offset);
    const safeLimit = Math.max(1, Math.min(limit, 100));

    const toolNameHashes = await contract.getAllToolsPaginated(safeOffset, safeLimit);
    return toolNameHashes;
  } catch (error: unknown) {
    const contractError = error as ContractError;
    const customError = getCustomErrorFromData(contractError);

    if (customError) {
      console.error(chalk.red(`Contract error: ${customError}`));
      throw new Error(`Contract error: ${customError}`);
    }

    console.error('Error getting tool name hashes:', error);
    throw error;
  }
};

const isToolOwner = async (name: string): Promise<boolean> => {
  try {
    const contract = await getRegistryContract(true);
    const nameHash = computeNameHash(name);
    const toolInfo = await contract.getToolInfo(nameHash);
    const ownerAddress = toolInfo[0];
    const address = await getWalletAddress();
    return ownerAddress.toLowerCase() === address.toLowerCase();
  } catch (error: unknown) {
    const contractError = error as ContractError;
    const customError = getCustomErrorFromData(contractError);

    if (isCustomError(contractError, 'Tool does not exist')) {
      console.log(chalk.yellow(`Tool ${name} does not exist.`));
      return false;
    }

    console.error(`Error checking ownership for tool ${name}:`, error);
    return false;
  }
};

export {
  getRegistryContract,
  registerTool,
  getToolInfo,
  getToolVersion,
  getToolVersions,
  getLatestToolVersion,
  getAllToolNameHashes,
  isToolOwner,
  parseVersion,
  computeNameHash,
  versionToString,
};
