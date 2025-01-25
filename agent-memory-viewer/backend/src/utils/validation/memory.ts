import { getObjectMetadata } from '@autonomys/auto-drive';
import { config } from '../../config/index.js';
import { createLogger } from '../logger.js';
import { validateLegacyMemory } from './signature.js';
import { validateSignature } from './signature.js';

const logger = createLogger('memory-validation');

export async function validateMemoryMetadata(api: any, cid: string): Promise<boolean> {
  try {
    const metadata = await getObjectMetadata(api, { cid });
    
    // Check if filename contains any of the configured agent usernames
    const validAgent = config.AGENTS.some(agent => 
      metadata?.name?.toLowerCase().includes(agent.username.toLowerCase())
    );

    if (!validAgent) {
      logger.warn('Memory rejected: File name does not contain any known agent username', {
        cid,
        filename: metadata.name,
        knownAgents: config.AGENTS.map(a => a.username),
      });
      return false;
    }

    const totalSize = Number(metadata.totalSize);
    if (totalSize > 102400) {
      logger.warn('Memory rejected: File size exceeds 100KB limit', {
        cid,
        size: totalSize,
      });
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Not Found')) {
      logger.warn('Memory not found, skipping download', {
        cid,
        error: errorMessage,
      });
      return false;
    }
    throw error;
  }
}

export async function validateMemoryData(memoryData: any): Promise<boolean> {
  if (!memoryData || typeof memoryData !== 'object') {
    logger.warn('Memory rejected: Invalid memory data format', {
      type: typeof memoryData,
    });
    return false;
  }
  logger.info('Memory validated as legacy version');
  return await validateLegacyMemory(memoryData);
}
