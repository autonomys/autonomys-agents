import { createLogger } from '../../../utils/logger.js';
import { config } from '../../../config/index.js';

const logger = createLogger('memory-pruning');
const { MAX_PROCESSED_IDS } = config.memoryConfig;

export const pruneProcessedIds = (ids: Set<string>): Set<string> => {
  const prunedIds = new Set(Array.from(ids).slice(-MAX_PROCESSED_IDS));

  logger.info('Pruned processed IDs', {
    originalSize: ids.size,
    newSize: prunedIds.size,
  });

  return prunedIds;
};
