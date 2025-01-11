import { createLogger } from '../../../utils/logger.js';
import { Tweet } from '../../../services/twitter/types.js';
import { config } from '../../../config/index.js';

const logger = createLogger('memory-pruning');

export const pruneMemorySet = <T extends Tweet>(set: ReadonlySet<T>): Set<T> => {
  const { MAX_TWEETS_PER_SET, MAX_AGE_IN_DAYS } = config.memoryConfig;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_IN_DAYS);

  const sortedTweets = Array.from(set)
    .filter(tweet => tweet.timeParsed && tweet.timeParsed > cutoffDate)
    .sort((a, b) => (b.timeParsed?.getTime() || 0) - (a.timeParsed?.getTime() || 0))
    .slice(0, MAX_TWEETS_PER_SET);

  logger.info('Pruned tweet set', {
    originalSize: set.size,
    newSize: sortedTweets.length,
    cutoffDate,
  });

  return new Set(sortedTweets);
};

export const pruneProcessedIds = (ids: Set<string>): Set<string> => {
  const { MAX_PROCESSED_IDS } = config.memoryConfig;
  const prunedIds = new Set(Array.from(ids).slice(-MAX_PROCESSED_IDS));

  logger.info('Pruned processed IDs', {
    originalSize: ids.size,
    newSize: prunedIds.size,
  });

  return prunedIds;
}; 