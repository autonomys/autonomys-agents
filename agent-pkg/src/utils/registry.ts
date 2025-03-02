import path from 'path';
import fs from 'fs/promises';
import { ToolMetadata, ToolRegistry } from '../types/index.js';
import { 
  getToolInfo, 
  getToolVersion,
  getToolVersions,
  getLatestToolVersion,
  getAllToolNames, 
  registerTool, 
  addToolVersion, 
  isToolOwner 
} from './contractClient.js';
import chalk from 'chalk';

// Local cache location
const CACHE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.autoOS');
const REGISTRY_CACHE_PATH = path.join(CACHE_DIR, 'registry.json');

// Initialize cache directory
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Get registry from cache or fetch from blockchain
export async function getRegistry(): Promise<ToolRegistry> {
  await ensureCacheDir();
  
  try {
    // Try to read from cache first for faster response
    const cacheData = await fs.readFile(REGISTRY_CACHE_PATH, 'utf8');
    const cachedRegistry = JSON.parse(cacheData) as ToolRegistry;
    
    // Check if cache is recent (less than 1 hour old)
    const cacheTime = new Date(cachedRegistry.updated);
    const now = new Date();
    const cacheAge = now.getTime() - cacheTime.getTime();
    const oneHour = 60 * 60 * 1000;
    
    if (cacheAge < oneHour) {
      return cachedRegistry;
    }
    
    // Cache is older than 1 hour, fetch from blockchain
    return await fetchRegistryFromBlockchain();
  } catch (error) {
    // Cache miss or invalid, fetch from blockchain
    return await fetchRegistryFromBlockchain();
  }
}


async function fetchRegistryFromBlockchain(): Promise<ToolRegistry> {
  try {
    console.log(chalk.blue('Fetching registry from blockchain...'));
    
    const toolNames = await getAllToolNames();
    
    const registry: ToolRegistry = {
      version: '1.0.0',
      updated: new Date().toISOString(),
      tools: {}
    };
    
    for (const name of toolNames) {
      const toolInfo = await getToolInfo(name);
      
      const latestVersionInfo = await getLatestToolVersion(name);
      
      let description = '';
      try {
        const metadataObj = JSON.parse(latestVersionInfo.metadata);
        description = metadataObj.description || '';
      } catch (e) {
        // TODO
      }
      
      registry.tools[name] = {
        name,
        version: toolInfo.latestVersion,
        description: description,
        author: toolInfo.owner,
        cid: latestVersionInfo.cid,
        updated: new Date(latestVersionInfo.timestamp * 1000).toISOString()
      };
    }
    
    // Save to cache
    await fs.writeFile(REGISTRY_CACHE_PATH, JSON.stringify(registry, null, 2));
    
    return registry;
  } catch (error) {
    console.error('Error fetching registry from blockchain:', error);
    
    const emptyRegistry: ToolRegistry = {
      version: '1.0.0',
      updated: new Date().toISOString(),
      tools: {}
    };
    
    return emptyRegistry;
  }
}

export async function getToolFromRegistry(toolName: string): Promise<ToolMetadata | null> {
  try {
    const toolInfo = await getToolInfo(toolName);
    
    if (toolInfo.latestVersion) {
      const latestVersionInfo = await getLatestToolVersion(toolName);

      let description = '';
      try {
        const metadataObj = JSON.parse(latestVersionInfo.metadata);
        description = metadataObj.description || '';
      } catch (e) {
        // TODO
      }
      
      // Return tool metadata
      return {
        name: toolName,
        version: toolInfo.latestVersion,
        description: description,
        author: toolInfo.owner,
        cid: latestVersionInfo.cid,
        updated: new Date(latestVersionInfo.timestamp * 1000).toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting tool ${toolName} from registry:`, error);
    
    const registry = await getLocalRegistryCache();
    return registry.tools[toolName] || null;
  }
}

/**
 * Get a specific version of a tool from the registry
 * @param toolName Name of the tool
 * @param version Specific version to retrieve
 * @returns Tool metadata for the specified version, or null if not found
 */
export async function getToolVersionFromRegistry(toolName: string, version: string): Promise<ToolMetadata | null> {
  try {
    // First check if the tool exists
    const toolInfo = await getToolInfo(toolName);
    
    if (!toolInfo.latestVersion) {
      console.error(`Tool ${toolName} not found in registry`);
      return null;
    }
    
    // Check if the specified version exists
    const versions = await getToolVersions(toolName);
    if (!versions.includes(version)) {
      console.error(`Version ${version} of tool ${toolName} not found`);
      return null;
    }
    
    // Get the specific version info
    const versionInfo = await getToolVersion(toolName, version);
    
    let description = '';
    try {
      const metadataObj = JSON.parse(versionInfo.metadata);
      description = metadataObj.description || '';
    } catch (e) {
      // Fallback if metadata can't be parsed
    }
    
    // Return tool metadata for specific version
    return {
      name: toolName,
      version: version,
      description: description,
      author: toolInfo.owner,
      cid: versionInfo.cid,
      updated: new Date(versionInfo.timestamp * 1000).toISOString()
    };
  } catch (error) {
    console.error(`Error getting version ${version} of tool ${toolName} from registry:`, error);
    
    // Try to fall back to local cache if possible
    const registry = await getLocalRegistryCache();
    const tool = registry.tools[toolName];
    
    // Only return from cache if it matches the requested version
    if (tool && tool.version === version) {
      return tool;
    }
    
    return null;
  }
}

async function getLocalRegistryCache(): Promise<ToolRegistry> {
  await ensureCacheDir();
  
  try {
    const cacheData = await fs.readFile(REGISTRY_CACHE_PATH, 'utf8');
    return JSON.parse(cacheData) as ToolRegistry;
  } catch (error) {
    return {
      version: '1.0.0',
      updated: new Date().toISOString(),
      tools: {}
    };
  }
}

export async function updateRegistry(toolMetadata: ToolMetadata): Promise<string> {
  try {
    console.log(chalk.blue('Updating registry on blockchain...'));
    
    let txHash = '';
    
    const metadata = JSON.stringify({
      description: toolMetadata.description || '',
      author: toolMetadata.author || '',
      updated: toolMetadata.updated || new Date().toISOString()
    });
    
    try {
      const exists = await getToolInfo(toolMetadata.name);
      
      if (exists.latestVersion && await isToolOwner(toolMetadata.name)) {
        console.log(chalk.yellow(`Tool ${toolMetadata.name} already exists. Adding new version ${toolMetadata.version}`));
        txHash = await addToolVersion(
          toolMetadata.name, 
          toolMetadata.cid, 
          toolMetadata.version,
          metadata
        );
      } else if (exists.latestVersion) {
        throw new Error(`Tool ${toolMetadata.name} already exists and you're not the owner`);
      } else {
        txHash = await registerTool(
          toolMetadata.name, 
          toolMetadata.cid, 
          toolMetadata.version,
          metadata
        );
      }
    } catch (error) {
      console.log(chalk.green(`Registering new tool ${toolMetadata.name}`));
      txHash = await registerTool(
        toolMetadata.name, 
        toolMetadata.cid, 
        toolMetadata.version,
        metadata
      );
    }
    
    const registry = await getLocalRegistryCache();
    registry.tools[toolMetadata.name] = toolMetadata;
    registry.updated = new Date().toISOString();
    await fs.writeFile(REGISTRY_CACHE_PATH, JSON.stringify(registry, null, 2));
    
    return txHash;
  } catch (error) {
    console.error('Error updating registry:', error);
    throw error;
  }
} 