import fs from 'fs/promises';
import { ToolMetadata, ToolRegistry } from '../../../types/index.js';
import {
  getAllToolNameHashes,
  getLatestToolVersion,
  getToolInfo,
  getToolVersion,
  getToolVersions,
} from '../../blockchain/contractClient.js';
import chalk from 'chalk';
import ora from 'ora';
import { REGISTRY_CACHE_PATH } from '../../shared/path.js';
import { downloadFileFromGateway } from '../../autoDrive/gatewayClient.js';
import { getCidFromHash } from '../../blockchain/utils.js';

const fetchRegistryFromBlockchain = async (): Promise<ToolRegistry | null> => {
  try {
    console.log(chalk.blue('Fetching registry from blockchain...'));

    const toolNames = await getAllToolNameHashes();
    if (!toolNames) {
      return null;
    }
    const registry: ToolRegistry = {
      version: '1.0.0',
      updated: new Date().toISOString(),
      tools: {},
    };

    for (const name of toolNames) {
      const toolInfo = await getToolInfo(name);
      if (!toolInfo) {
        continue;
      }
      const latestVersionInfo = await getLatestToolVersion(name);
      if (!latestVersionInfo) {
        continue;
      }
      registry.tools[name] = {
        name,
        version: toolInfo.latestVersion,
        author: toolInfo.owner,
        cid: latestVersionInfo.cid,
        metadataCid: latestVersionInfo.metadataCid,
        updated: new Date(latestVersionInfo.timestamp * 1000).toISOString(),
      };
    }

    await fs.writeFile(REGISTRY_CACHE_PATH, JSON.stringify(registry, null, 2));

    return registry;
  } catch (error) {
    console.error('Error fetching registry from blockchain:', error);

    const emptyRegistry: ToolRegistry = {
      version: '1.0.0',
      updated: new Date().toISOString(),
      tools: {},
    };

    return emptyRegistry;
  }
};

const getLocalRegistryCache = async (): Promise<ToolRegistry> => {
  try {
    const cacheData = await fs.readFile(REGISTRY_CACHE_PATH, 'utf8');
    return JSON.parse(cacheData) as ToolRegistry;
  } catch (error) {
    console.error('Error reading registry cache:', error);
    return {
      version: '1.0.0',
      updated: new Date().toISOString(),
      tools: {},
    };
  }
};

const getRegistry = async (): Promise<ToolRegistry> => {
  const cacheData = await fs.readFile(REGISTRY_CACHE_PATH, 'utf8');
  const cachedRegistry = JSON.parse(cacheData) as ToolRegistry;
  try {
    const registry = await fetchRegistryFromBlockchain();
    if (!registry) {
      chalk.red('Error fetching registry from blockchain - using cached registry');
      return cachedRegistry;
    }
    return registry;
  } catch (error) {
    console.error('Error fetching registry from blockchain:', error);
    throw error;
  }
};

const getToolFromRegistry = async (toolName: string): Promise<ToolMetadata | null> => {
  try {
    const toolInfo = await getToolInfo(toolName);
    if (!toolInfo) {
      return null;
    }
    if (toolInfo.latestVersion) {
      const latestVersionInfo = await getLatestToolVersion(toolName);
      if (!latestVersionInfo) {
        return null;
      }
      return {
        name: toolName,
        version: toolInfo.latestVersion,
        metadataCid: latestVersionInfo.metadataCid,
        author: toolInfo.owner,
        cid: latestVersionInfo.cid,
        updated: new Date(latestVersionInfo.timestamp * 1000).toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error(`Error getting tool ${toolName} from registry:`, error);

    const registry = await getLocalRegistryCache();
    return registry.tools[toolName] || null;
  }
};

const getToolVersionFromRegistry = async (
  toolName: string,
  version: string,
): Promise<ToolMetadata | null> => {
  try {
    const toolInfo = await getToolInfo(toolName);
    if (!toolInfo) {
      return null;
    }

    if (!toolInfo.latestVersion) {
      console.error(`Tool ${toolName} not found in registry`);
      return null;
    }

    const versions = await getToolVersions(toolName);
    if (!versions) {
      return null;
    }
    if (!versions.includes(version)) {
      console.error(`Version ${version} of tool ${toolName} not found`);
      return null;
    }

    const versionInfo = await getToolVersion(toolName, version);
    if (!versionInfo) {
      return null;
    }

    return {
      name: toolName,
      version: version,
      metadataCid: versionInfo.metadataCid,
      author: toolInfo.owner,
      cid: versionInfo.cid,
      updated: new Date(versionInfo.timestamp * 1000).toISOString(),
    };
  } catch (error) {
    console.error(`Error getting version ${version} of tool ${toolName} from registry:`, error);

    const registry = await getLocalRegistryCache();
    const tool = registry.tools[toolName];

    if (tool && tool.version === version) {
      return tool;
    }

    return null;
  }
};

const fetchMetadataFromCid = async (metadataCid: string): Promise<string | null> => {
  const spinner = ora(`Fetching metadata \n`).start();
  try {
    const cid = getCidFromHash(metadataCid);
    spinner.text = `Downloading file from gateway: ${cid}`;
    const responseStream = await downloadFileFromGateway(cid);

    // Convert readable stream to buffer and then to JSON
    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    spinner.succeed(`Successfully downloaded metadata`);
    return buffer.toString('utf-8');
  } catch (error) {
    spinner.fail(`Failed to download metadata: ${error}`);
    throw error;
  }
};

const getToolMetadata = async (toolName: string, version?: string): Promise<string | null> => {
  if (version) {
    const versionInfo = await getToolVersionFromRegistry(toolName, version);
    if (!versionInfo) {
      return null;
    }
    return fetchMetadataFromCid(versionInfo.metadataCid);
  }
  const toolInfo = await getToolFromRegistry(toolName);
  if (!toolInfo) {
    return null;
  }
  return fetchMetadataFromCid(toolInfo.metadataCid);
};

export {
  getLocalRegistryCache,
  getRegistry,
  getToolVersionFromRegistry,
  getToolFromRegistry,
  getToolMetadata,
};
