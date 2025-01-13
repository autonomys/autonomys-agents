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
    },
    blockchainConfig: {
      RPC_URL: 'http://mock-rpc',
      PRIVATE_KEY: '1234567890123456789012345678901234567890123456789012345678901234',
      CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890'
    }
  }
}), { virtual: true }); 

jest.mock('../src/agents/tools/utils/agentWallet.ts', () => ({
  wallet: {
    getNonce: jest.fn().mockResolvedValue(0),
    signMessage: jest.fn().mockResolvedValue('0xmockedsignature')
  }
}), { virtual: true });

jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn().mockReturnValue({
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 })
  }),
  Wallet: jest.fn().mockReturnValue({
    getNonce: jest.fn().mockResolvedValue(0),
    signMessage: jest.fn().mockResolvedValue('0xmockedsignature')
  }),
  Contract: jest.fn()
}), { virtual: true }); 

jest.mock('../src/agents/tools/utils/dsnUpload.ts', () => ({
  uploadToDsn: jest.fn().mockResolvedValue('0xmockedtxhash'),
  currentNonce: 0
}), { virtual: true }); 

jest.mock('../src/agents/workflows/kol/prompts.ts', () => ({
  loadCharacter: jest.fn().mockImplementation((characterFile) => Promise.resolve({
    name: `Test ${characterFile}`,
    username: 'test-user',
    description: 'A test character',
    personality: 'Friendly and helpful',
    expertise: 'Testing',
    rules: 'Be helpful',
    trendFocus: 'Testing trends',
    contentFocus: 'Test content',
    replyStyle: 'Professional',
    wordsToAvoid: ['bad', 'words'],
    engagementCriteria: 'Engage with relevant topics'
  })),
  engagementParser: {},
  responseParser: {},
  trendParser: {},
  trendTweetParser: {},
  summaryParser: {},
  createPrompts: jest.fn().mockImplementation(() => ({
    engagementPrompt: {},
    responsePrompt: {},
    trendPrompt: {},
    summaryPrompt: {},
  }))
}), { virtual: true }); 