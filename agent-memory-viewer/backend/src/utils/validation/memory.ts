import { createLogger } from '../logger.js';
import { validateMemorySignature } from './signature.js';

const logger = createLogger('memory-validation');

export const validateMemoryData = async (
  memoryData: any,
  agentAddress: string,
): Promise<boolean> => {
  if (!memoryData || typeof memoryData !== 'object') {
    logger.warn('Memory rejected: Invalid memory data format', {
      type: typeof memoryData,
    });
    return false;
  }
  logger.info('Verifying experience signature');
  return await validateMemorySignature(memoryData, agentAddress);
};
