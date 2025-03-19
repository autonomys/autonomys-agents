import fs from 'fs/promises';
import { ToolMetadata } from '../../../types/index.js';
import {
  getToolInfo,
  registerTool,
  addToolVersion,
  isToolOwner,
} from '../../../utils/blockchain/contractClient.js';
import chalk from 'chalk';
import { REGISTRY_CACHE_PATH } from '../../../utils/shared/path.js';
import { getLocalRegistryCache } from './toolInquiry.js';
/**
 * Update the registry on the blockchain
 * @param toolMetadata Tool metadata to update
 * @returns Transaction hash of the update
 */
export const updateRegistry = async (toolMetadata: ToolMetadata): Promise<string> => {
  try {
    console.log(chalk.blue('Updating registry on blockchain...'));

    let txHash = '';

    const metadata = JSON.stringify({
      description: toolMetadata.description || '',
      author: toolMetadata.author || '',
      updated: toolMetadata.updated || new Date().toISOString(),
    });

    try {
      const exists = await getToolInfo(toolMetadata.name);

      if (exists.latestVersion && (await isToolOwner(toolMetadata.name))) {
        console.log(
          chalk.yellow(
            `Tool ${toolMetadata.name} already exists. Adding new version ${toolMetadata.version}`,
          ),
        );
        txHash = await addToolVersion(
          toolMetadata.name,
          toolMetadata.cid,
          toolMetadata.version,
          metadata,
        );
      } else if (exists.latestVersion) {
        throw new Error(`Tool ${toolMetadata.name} already exists and you're not the owner`);
      } else {
        txHash = await registerTool(
          toolMetadata.name,
          toolMetadata.cid,
          toolMetadata.version,
          metadata,
        );
      }
    } catch (error) {
      console.log(chalk.green(`Registering new tool ${toolMetadata.name}`));
      txHash = await registerTool(
        toolMetadata.name,
        toolMetadata.cid,
        toolMetadata.version,
        metadata,
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
};
