import { getObjectMetadata } from '@autonomys/auto-drive';
import { config } from '../../config/index.js';
import { createLogger } from '../logger.js';
import { validateMemorySignature } from './signature.js';

const logger = createLogger('memory-validation');

export async function validateMemoryMetadata(
  api: any,
  cid: string,
): Promise<{ isValid: boolean; agentName?: string }> {
  try {
    const metadata = await getObjectMetadata(api, { cid });

    // Find matching agent by username in filename
    const matchingAgent = config.AGENTS.find(agent =>
      metadata?.name?.toLowerCase().includes(agent.username.toLowerCase()),
    );

    if (!matchingAgent) {
      logger.warn('Memory rejected: File name does not contain any known agent username', {
        cid,
        filename: metadata.name,
        knownAgents: config.AGENTS.map(a => a.username),
      });
      return { isValid: false };
    }

    const totalSize = Number(metadata.totalSize);
    if (totalSize > 102400) {
      logger.warn('Memory rejected: File size exceeds 100KB limit', {
        cid,
        size: totalSize,
      });
      return { isValid: false };
    }

    return { isValid: true, agentName: matchingAgent.username };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Not Found')) {
      logger.warn('Memory not found, skipping download', {
        cid,
        error: errorMessage,
      });
      return { isValid: false };
    }
    throw error;
  }
}

export async function validateMemoryData(memoryData: any, agentAddress: string): Promise<boolean> {
  if (!memoryData || typeof memoryData !== 'object') {
    logger.warn('Memory rejected: Invalid memory data format', {
      type: typeof memoryData,
    });
    return false;
  }
  logger.info('Verifying experience signature');
  return await validateMemorySignature(memoryData, agentAddress);
}
