// Explicitly mock the config module
jest.mock('../src/config/index.js', () => ({
  config: {
    twitterConfig: {
      USERNAME: 'test-user',
      PASSWORD: 'test-pass',
      COOKIES_PATH: '/test/cookies.json',
      POST_TWEETS: false,
      RESPONSE_INTERVAL_MS: 3600000,
      POST_INTERVAL_MS: 5400000,
      MAX_MENTIONS: 20,
      NUM_TIMELINE_TWEETS: 10,
      NUM_FOLLOWING_RECENT_TWEETS: 10,
      NUM_RANDOM_FOLLOWERS: 5
    },
    llmConfig: {
      nodes: {
        decision: { size: 'small', temperature: 0 },
        analyze: { size: 'large', temperature: 0 },
        generation: { size: 'large', temperature: 0.7 },
        response: { size: 'large', temperature: 0.7 }
      }
    }
  }
}), { virtual: true }); 