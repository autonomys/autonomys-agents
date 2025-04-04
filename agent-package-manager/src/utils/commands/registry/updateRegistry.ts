import fs from 'fs/promises';
import { ToolMetadata } from '../../../types/index.js';
import {
  getToolInfo,
  isToolOwner,
  registerTool,
} from '../../../utils/blockchain/contractClient.js';
import chalk from 'chalk';
import { REGISTRY_CACHE_PATH } from '../../../utils/shared/path.js';
import { getLocalRegistryCache } from './toolInquiry.js';

const updateRegistry = async (
  toolMetadata: ToolMetadata,
  metadataCid: string,
): Promise<{ txHash: string; error?: string }> => {
  try {
    console.log(chalk.blue('Updating registry on blockchain...'));

    let txHash = '';

    try {
      const exists = await getToolInfo(toolMetadata.name);
      const isOwner = exists?.latestVersion ? await isToolOwner(toolMetadata.name) : false;
      const registryCase = exists?.latestVersion
        ? isOwner
          ? 'UPDATE_EXISTING' // TODO: Implement update existing
          : 'NOT_OWNER'
        : 'REGISTER_NEW';

      console.log(chalk.blue(`Registry case: ${registryCase}`));
      switch (registryCase) {
        case 'NOT_OWNER':
          throw new Error(`Tool ${toolMetadata.name} already exists and you're not the owner`);

        case 'REGISTER_NEW':
        case 'UPDATE_EXISTING':
          const txHash = await registerTool(
            toolMetadata.name,
            toolMetadata.cid,
            toolMetadata.version,
            metadataCid,
          );
          if (!txHash) {
            throw new Error(`Failed to register tool ${toolMetadata.name}`);
          }
          console.log(
            chalk.green(
              `Tool ${toolMetadata.name} registered with CID: ${toolMetadata.cid}, txHash: ${txHash}`,
            ),
          );
          break;
      }
    } catch (error) {
      console.error(
        `Error updating registry:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return { txHash: '', error: error instanceof Error ? error.message : 'Unknown error' };
    }

    const registry = await getLocalRegistryCache();
    registry.tools[toolMetadata.name] = toolMetadata;
    registry.updated = new Date().toISOString();
    await fs.writeFile(REGISTRY_CACHE_PATH, JSON.stringify(registry, null, 2));

    return { txHash, error: undefined };
  } catch (error) {
    console.error('Error updating registry:', error);
    return { txHash: '', error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export { updateRegistry };
