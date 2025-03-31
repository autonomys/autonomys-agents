import { ethers } from 'ethers';
import { loadConfig } from '../../config/index.js';
import { loadCredentials } from '../credential/index.js';
import chalk from 'chalk';
import { getHashFromCid } from './utils.js';
import AutonomysPackageRegistry from './AutonomysPackageRegistry.abi.json' with { type: 'json' };
import { getWalletAddress } from './utils.js';
import {
  ContractError,
  ContractErrorType,
  ToolInfo,
  ToolLatestVersionInfo,
  ToolVersionInfo,
  Version,
} from './types.js';
import { getErrorType } from './errorHandler.js';

// Convert string version to Version struct
const parseVersion = (versionStr: string): Version => {
  const [major, minor, patch] = versionStr.split('.').map(Number);
  return { major, minor, patch };
};

// Compute nameHash from string using keccak256
const computeNameHash = (name: string): string => {
  return ethers.keccak256(ethers.toUtf8Bytes(name));
};

// Convert Version struct to string
const versionToString = (version: Version): string => {
  return `${version.major}.${version.minor}.${version.patch}`;
};

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
): Promise<string | null> => {
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
    const errorType = getErrorType(contractError);

    // Handle specific error types with appropriate messages
    switch (errorType) {
      case ContractErrorType.VersionAlreadyExists:
        console.error(chalk.red(`Version ${version} already exists for tool ${name}.`));
        return null;

      case ContractErrorType.ToolNameAlreadyRegistered:
        console.error(chalk.red(`Tool name ${name} is already registered by another owner.`));
        return null;

      case ContractErrorType.InvalidVersionOrder:
        console.error(
          chalk.red(`Version ${version} must be greater than the latest registered version.`),
        );
        return null;

      case null:
        // Unknown error
        console.error(`Error registering tool ${name}:`, error);
        return null;

      default:
        // Other known error types
        console.error(chalk.red(`Contract error: ${errorType}`));
        return null;
    }
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
    const errorType = getErrorType(contractError);

    // Return null for Tool not found errors
    if (errorType === ContractErrorType.ToolNotFound) {
      return null;
    }

    if (errorType) {
      console.error(chalk.red(`Contract error: ${errorType}`));
      return null;
    }

    return null;
  }
};

const getToolVersion = async (name: string, version: string): Promise<ToolVersionInfo | null> => {
  try {
    const contract = await getRegistryContract(true);
    const nameHash = computeNameHash(name);
    const versionObj = parseVersion(version);

    const [_retrievedVersion, cidHash, timestamp, metadataHash] = await contract.getToolVersion(
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
    const errorType = getErrorType(contractError);

    switch (errorType) {
      case ContractErrorType.ToolNotFound:
        console.error(chalk.red(`Tool ${name} does not exist`));
        return null;

      case ContractErrorType.VersionNotExists:
        console.error(chalk.red(`Version ${version} does not exist for tool ${name}`));
        return null;

      case null:
        // Unknown error
        console.error(`Error getting version ${version} for tool ${name}:`, error);
        return null;

      default:
        // Other known error types
        console.error(chalk.red(`Contract error: ${errorType}`));
        return null;
    }
  }
};

const getToolVersions = async (name: string): Promise<string[] | null> => {
  try {
    const contract = await getRegistryContract(true);
    const nameHash = computeNameHash(name);
    const versions = await contract.getToolVersions(nameHash);

    const versionStrings = versions.map((v: Version) => `${v.major}.${v.minor}.${v.patch}`);
    console.log(chalk.green(`Found ${versionStrings.length} versions for tool ${name}`));
    return versionStrings;
  } catch (error: unknown) {
    const contractError = error as ContractError;
    const errorType = getErrorType(contractError);

    if (errorType === ContractErrorType.ToolNotFound) {
      console.error(chalk.red(`Tool ${name} does not exist`));
      return null;
    }

    if (errorType) {
      console.error(chalk.red(`Contract error: ${errorType}`));
      return null;
    }

    return null;
  }
};

const getLatestToolVersion = async (name: string): Promise<ToolLatestVersionInfo | null> => {
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
    const errorType = getErrorType(contractError);

    if (errorType === ContractErrorType.ToolNotFound) {
      console.error(chalk.red(`Tool ${name} does not exist`));
      return null;
    }

    if (errorType) {
      console.error(chalk.red(`Contract error: ${errorType}`));
      return null;
    }

    return null;
  }
};

const getAllToolNameHashes = async (
  offset: number = 0,
  limit: number = 100,
): Promise<string[] | null> => {
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
    const errorType = getErrorType(contractError);

    if (errorType) {
      console.error(chalk.red(`Contract error: ${errorType}`));
      return null;
    }

    return null;
  }
};

const isToolOwner = async (name: string): Promise<boolean | null> => {
  try {
    const contract = await getRegistryContract(true);
    const nameHash = computeNameHash(name);
    const toolInfo = await contract.getToolInfo(nameHash);
    const ownerAddress = toolInfo[0];
    const address = await getWalletAddress();
    return ownerAddress.toLowerCase() === address.toLowerCase();
  } catch (error: unknown) {
    const contractError = error as ContractError;
    const errorType = getErrorType(contractError);

    if (errorType === ContractErrorType.ToolNotFound) {
      console.log(chalk.yellow(`Tool ${name} does not exist.`));
      return null;
    }

    return null;
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
