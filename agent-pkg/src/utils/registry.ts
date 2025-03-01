import path from 'path';
import fs from 'fs/promises';
import { ToolMetadata, ToolRegistry } from '../types/index.js';

// Known entry point CID for the registry
const REGISTRY_ENTRY_CID = 'PLACEHOLDER_REGISTRY_CID'; // We'll create this when we first publish the registry

// Local cache location
const CACHE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.agentOS');
const REGISTRY_CACHE_PATH = path.join(CACHE_DIR, 'registry.json');

// Initialize cache directory
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Get registry from cache or download fresh copy
export async function getRegistry(): Promise<ToolRegistry> {
  await ensureCacheDir();
  
  try {
    // Try to read from cache first
    const cacheData = await fs.readFile(REGISTRY_CACHE_PATH, 'utf8');
    const cachedRegistry = JSON.parse(cacheData) as ToolRegistry;
    
    // TODO: Check if registry needs update based on some TTL logic
    
    return cachedRegistry;
  } catch (error) {
    // Cache miss or invalid, download fresh registry
    try {
      // TODO: Implement download from Autonomys DSN
      // const registry = await download(REGISTRY_ENTRY_CID) as unknown as ToolRegistry;
      
      // For now, return empty registry
      const emptyRegistry: ToolRegistry = {
        version: '0.1.0',
        updated: new Date().toISOString(),
        tools: {}
      };
      
      // Save to cache
      await fs.writeFile(REGISTRY_CACHE_PATH, JSON.stringify(emptyRegistry, null, 2));
      
      return emptyRegistry;
    } catch (dlError) {
      // If this is first run or registry doesn't exist yet, return empty registry
      const emptyRegistry: ToolRegistry = {
        version: '0.1.0',
        updated: new Date().toISOString(),
        tools: {}
      };
      
      await fs.writeFile(REGISTRY_CACHE_PATH, JSON.stringify(emptyRegistry, null, 2));
      return emptyRegistry;
    }
  }
}

// Get a specific tool from the registry
export async function getToolFromRegistry(toolName: string): Promise<ToolMetadata | null> {
  const registry = await getRegistry();
  return registry.tools[toolName] || null;
}

// Update registry with new tool
export async function updateRegistry(toolMetadata: ToolMetadata): Promise<string> {
  // Get current registry
  const registry = await getRegistry();
  
  // Save old CID
  const previousRegistryCid = REGISTRY_ENTRY_CID;
  
  // Update registry
  registry.tools[toolMetadata.name] = toolMetadata;
  registry.updated = new Date().toISOString();
  registry.previousRegistryCid = previousRegistryCid;
  
  // TODO: Implement upload to Autonomys DSN
  // const uploadResult = await uploadToDsn(registry);
  // const newCid = uploadResult.cid;
  const newCid = 'placeholder-registry-cid';
  
  // Update cache
  await fs.writeFile(REGISTRY_CACHE_PATH, JSON.stringify(registry, null, 2));
  
  // TODO: Update the REGISTRY_ENTRY_CID reference for future lookups
  // This will require some mechanism to track the "latest" registry CID
  
  return newCid;
} 