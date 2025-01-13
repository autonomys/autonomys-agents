import { Tweet } from '../../../../../src/services/twitter/types';

export const createMockState = () => ({
  messages: [],
  timelineTweets: new Set<Tweet>(),
  mentionsTweets: new Set<Tweet>(),
  processedTweetIds: new Set<string>(),
  repliedToTweetIds: new Set<string>(),
  myRecentTweets: new Set<Tweet>(),
  myRecentReplies: new Set<Tweet>(),
  trendAnalysisTweets: new Set<Tweet>(),
  dsnData: [],
  summary: { patterns: [], commonWords: [] },
  trendAnalysis: { summary: '', trends: [] },
  engagementDecisions: [],
});

export const createMockTweet = (overrides = {}): Tweet => ({
  id: '123',
  text: 'Test tweet',
  username: 'testuser',
  timeParsed: new Date(),
  hashtags: [],
  mentions: [],
  photos: [],
  videos: [],
  urls: [],
  thread: [],
  ...overrides,
});
