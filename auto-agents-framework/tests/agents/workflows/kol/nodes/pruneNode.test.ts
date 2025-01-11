import { createMockState, createMockTweet } from '../__fixtures__/mockState';
import { pruneState, State } from '../../../../../src/agents/workflows/kol/workflow';
import { config } from '../../../../../src/config/index';

describe('Prune Node', () => {
  let mockState: typeof State.State;

  beforeEach(() => {
    mockState = createMockState();
    jest.clearAllMocks();
  });

  it('should prune all tweet sets according to memory config', () => {
    // Mock memory config
    jest.replaceProperty(config.memoryConfig, 'MAX_TWEETS_PER_SET', 3);
    jest.replaceProperty(config.memoryConfig, 'MAX_PROCESSED_IDS', 2);
    jest.replaceProperty(config.memoryConfig, 'MAX_AGE_IN_DAYS', 2);

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const oldTweet = createMockTweet({ id: '1', timeParsed: threeDaysAgo });
    const recentTweet1 = createMockTweet({ id: '2', timeParsed: oneDayAgo });
    const recentTweet2 = createMockTweet({ id: '3', timeParsed: now });
    const recentTweet3 = createMockTweet({ id: '4', timeParsed: now });

    mockState.timelineTweets = new Set([oldTweet, recentTweet1, recentTweet2, recentTweet3]);
    mockState.mentionsTweets = new Set([oldTweet, recentTweet1, recentTweet2, recentTweet3]);
    mockState.myRecentTweets = new Set([oldTweet, recentTweet1, recentTweet2, recentTweet3]);
    mockState.myRecentReplies = new Set([oldTweet, recentTweet1, recentTweet2, recentTweet3]);
    mockState.trendAnalysisTweets = new Set([oldTweet, recentTweet1, recentTweet2, recentTweet3]);

    mockState.processedTweetIds = new Set(['1', '2', '3', '4']);
    mockState.repliedToTweetIds = new Set(['5', '6', '7', '8']);

    const prunedState = pruneState(mockState);

    expect(prunedState.timelineTweets.size).toBe(config.memoryConfig.MAX_TWEETS_PER_SET);
    expect(prunedState.mentionsTweets.size).toBe(config.memoryConfig.MAX_TWEETS_PER_SET);
    expect(prunedState.myRecentTweets.size).toBe(config.memoryConfig.MAX_TWEETS_PER_SET);
    expect(prunedState.myRecentReplies.size).toBe(config.memoryConfig.MAX_TWEETS_PER_SET);
    expect(prunedState.trendAnalysisTweets.size).toBe(config.memoryConfig.MAX_TWEETS_PER_SET);

    const allSets = [
      prunedState.timelineTweets,
      prunedState.mentionsTweets,
      prunedState.myRecentTweets,
      prunedState.myRecentReplies,
      prunedState.trendAnalysisTweets,
    ];

    allSets.forEach(set => {
      const tweets = Array.from(set);
      expect(tweets.some(t => t.id === oldTweet.id)).toBe(false);
    });

    // Check processed IDs are pruned correctly (should have MAX_PROCESSED_IDS = 2)
    expect(prunedState.processedTweetIds.size).toBe(config.memoryConfig.MAX_PROCESSED_IDS);
    expect(prunedState.repliedToTweetIds.size).toBe(config.memoryConfig.MAX_PROCESSED_IDS);
  });

  it('should maintain other state properties unchanged', () => {
    mockState.summary = { patterns: ['test'], commonWords: ['word'] };
    mockState.trendAnalysis = {
      summary: 'test',
      trends: [
        {
          topic: 'trend1',
          description: 'test trend',
          trendStrength: 0.8,
        },
      ],
    };
    mockState.engagementDecisions = [
      { decision: { shouldEngage: true, reason: 'test' }, tweet: createMockTweet() },
    ];
    mockState.dsnData = [{ type: 'test', data: 'test' }];

    const prunedState = pruneState(mockState);

    expect(prunedState.summary).toEqual(mockState.summary);
    expect(prunedState.trendAnalysis).toEqual(mockState.trendAnalysis);
    expect(prunedState.engagementDecisions).toEqual(mockState.engagementDecisions);
    expect(prunedState.dsnData).toEqual(mockState.dsnData);
  });
});
