import { ethers } from 'ethers';
import { loadConfig } from '../../config/index.js';
import { loadCredentials } from '../credential/index.js';
import chalk from 'chalk';
import { getHashFromCid } from './utils.js';
import AutonomysPackageRegistry from './AutonomysPackageRegistry.abi.json' assert { type: "json" };
import { getWalletAddress } from './utils.js';


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
    
    const cidHash = getHashFromCid(cid);
    const metadataHash = getHashFromCid(metadataCid);
    
    const tx = await contract.registerTool(name, version, cidHash, metadataHash);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error(`Error registering tool ${name}:`, error);
    throw error;
  }
};


const getToolInfo = async (
  name: string,
): Promise<{
  owner: string;
  versionCount: number;
  latestVersion: string;
} | null> => {
  try {
    const contract = await getRegistryContract(true);
    const [owner, versionCount, latestVersion] = await contract.getToolInfo(name);
    
    return {
      owner,
      versionCount: Number(versionCount),
      latestVersion,
    };
  } catch (error: unknown) {
    // TODO - We have to handle this with proper types and return results
    if (typeof error === 'object' && error !== null && 'reason' in error && error.reason === "Tool does not exist") {
      return null;
    }
    
    console.error(`Error getting info for tool ${name}:`, error);
    throw error;
  }
};


const getToolVersion = async (
  name: string,
  version: string,
): Promise<{
  cid: string;
  timestamp: number;
  metadataCid: string;
}> => {
  try {
    const contract = await getRegistryContract(true);
    
    const [cid, timestamp, metadataCid] = await contract.getToolVersion(name, version);
    
    return { cid, timestamp: Number(timestamp), metadataCid };
  } catch (error) {
    console.error(`Error getting version ${version} for tool ${name}:`, error);
    throw error;
  }
};


const getToolVersions = async (name: string): Promise<string[]> => {
  try {
    const contract = await getRegistryContract(true);
    
    const versions = await contract.getToolVersions(name);
    console.log(chalk.green(`Found ${versions.length} versions for tool ${name}`));
    return versions;
  } catch (error) {
    console.error(`Error getting versions for tool ${name}:`, error);
    throw error;
  }
};


const getLatestToolVersion = async (
  name: string,
): Promise<{
  version: string;
  cid: string;
  timestamp: number;
  metadataCid: string;
}> => {
  try {
    const contract = await getRegistryContract(true);    
    
    const result = await contract.getLatestVersion(name);
    const version = result[0];
    const cid = result[1];
    const timestamp = Number(result[2]);
    const metadataCid = result[3];
    return {
      version,
      cid,
      timestamp,
      metadataCid,
    };
  } catch (error) {
    console.error(`Error getting latest version for tool ${name}:`, error);
    throw error;
  }
};


const getAllToolNames = async (
  offset: number = 0, 
  limit: number = 100
): Promise<string[]> => {
  try {
    console.log(chalk.blue(`Getting all tool names with offset ${offset} and limit ${limit}`));
    const contract = await getRegistryContract(true);
    const safeOffset = Math.max(0, offset);
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const toolNames = await contract.getAllTools(safeOffset, safeLimit);  

    return toolNames;
  } catch (error) {
    console.error('Error getting tool names:', error);
    throw error;
  }
};



const isToolOwner = async (name: string): Promise<boolean> => {
  try {
    const contract = await getRegistryContract(true);
    const toolInfo = await contract.getToolInfo(name);
    const ownerAddress = toolInfo[0];
    const address = await getWalletAddress();
    try {

      return ownerAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error(`Error checking ownership for tool ${name}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`Error checking ownership for tool ${name}:`, error);
    return false;
  }
};

export { getRegistryContract, registerTool, getToolInfo, getToolVersion, getToolVersions, getLatestToolVersion, getAllToolNames, isToolOwner };