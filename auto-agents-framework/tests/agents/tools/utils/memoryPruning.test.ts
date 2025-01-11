import { pruneMemorySet, pruneProcessedIds } from '../../../../src/agents/tools/utils/memoryPruning';
import { createMockTweet } from '../../workflows/kol/__fixtures__/mockState';

// Mock the config and logger
jest.mock('../../../../src/config/index', () => ({
  config: {
    memoryConfig: {
      maxTweetsPerSet: 3,
      maxProcessedIds: 2,
      maxAgeInDays: 2
    }
  }
}));

jest.mock('../../../../src/utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn()
  })
}));

describe('Memory Pruning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pruneMemorySet', () => {
    it('should prune tweets older than maxAgeInDays', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      const tweets = new Set([
        createMockTweet({ id: '1', timeParsed: threeDaysAgo }),
        createMockTweet({ id: '2', timeParsed: oneDayAgo }),
        createMockTweet({ id: '3', timeParsed: now }),
      ]);

      const prunedTweets = pruneMemorySet(tweets);
      expect(prunedTweets.size).toBe(2);
      expect(Array.from(prunedTweets).map(t => t.id)).not.toContain('1');
    });

    it('should limit the number of tweets to maxTweetsPerSet', () => {
      const now = new Date();
      const tweets = new Set([
        createMockTweet({ id: '1', timeParsed: now }),
        createMockTweet({ id: '2', timeParsed: now }),
        createMockTweet({ id: '3', timeParsed: now }),
        createMockTweet({ id: '4', timeParsed: now }),
      ]);

      const prunedTweets = pruneMemorySet(tweets);
      expect(prunedTweets.size).toBe(3); // maxTweetsPerSet is 3
    });

    it('should sort tweets by timestamp and keep most recent', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const tweets = new Set([
        createMockTweet({ id: '1', timeParsed: twoDaysAgo }),
        createMockTweet({ id: '2', timeParsed: oneDayAgo }),
        createMockTweet({ id: '3', timeParsed: now }),
        createMockTweet({ id: '4', timeParsed: now }),
      ]);

      const prunedTweets = pruneMemorySet(tweets);
      const prunedIds = Array.from(prunedTweets).map(t => t.id);
      expect(prunedIds).toContain('3');
      expect(prunedIds).toContain('4');
    });
  });

  describe('pruneProcessedIds', () => {
    it('should limit the number of IDs to maxProcessedIds', () => {
      const ids = new Set(['1', '2', '3', '4']);
      const prunedIds = pruneProcessedIds(ids);
      expect(prunedIds.size).toBe(2); // maxProcessedIds is 2
    });

    it('should keep the most recent IDs', () => {
      const ids = new Set(['1', '2', '3', '4']);
      const prunedIds = pruneProcessedIds(ids);
      const prunedArray = Array.from(prunedIds);
      expect(prunedArray).toEqual(['3', '4']); // Should keep last 2 IDs
    });

    it('should handle empty sets', () => {
      const ids = new Set<string>();
      const prunedIds = pruneProcessedIds(ids);
      expect(prunedIds.size).toBe(0);
    });
  });
}); 