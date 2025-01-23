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
    characterConfig: {
      characterPath: '/test/characters',
      description: 'Test character description',
      personality: 'Test personality',
      name: 'Test Character',
      username: 'testuser'
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
    },
    memoryConfig: {
      MAX_PROCESSED_IDS: 2,
    }
  }
}), { virtual: true }); 

jest.mock('../src/agents/tools/utils/blockchain/agentWallet.ts', () => ({
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

jest.mock('../src/agents/tools/utils/dsn/dsnUpload.ts', () => ({
  uploadToDsn: jest.fn().mockResolvedValue('0xmockedtxhash'),
  currentNonce: 0
}), { virtual: true }); 

jest.mock('../src/agents/workflows/twitter/prompts.ts', () => ({
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

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
  const mockResults = [
    { 
      rowid: 1, 
      content: 'Machine learning is a subset of artificial intelligence',
      distance: 0.1
    },
    { 
      rowid: 2, 
      content: 'Natural language processing and AI are related fields',
      distance: 0.2
    }
  ];

  return jest.fn().mockImplementation(() => ({
    prepare: jest.fn().mockImplementation((query) => ({
      run: jest.fn(),
      get: jest.fn().mockReturnValue({ min_id: 1 }),
      all: jest.fn().mockImplementation((...params) => {
        // Extract the limit from knn_param in the query
        const knnMatch = query.match(/knn_param\(., (\d+)\)/);
        if (knnMatch) {
          const limit = parseInt(knnMatch[1]);
          return mockResults.slice(0, limit);
        }
        return mockResults;
      }),
      finalize: jest.fn(),
    })),
    transaction: jest.fn(),
    exec: jest.fn(),
    close: jest.fn(),
    pragma: jest.fn(),
    loadExtension: jest.fn(),
  }));
});

// Mock vectorlite
jest.mock('vectorlite', () => ({
  Index: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    search: jest.fn().mockReturnValue([{ id: 1, distance: 0.5 }]),
    save: jest.fn(),
    load: jest.fn(),
    dimension: 1536,
    metric: 'cosine',
  })),
  __esModule: true,
  default: {
    Index: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      search: jest.fn().mockReturnValue([{ id: 1, distance: 0.5 }]),
      save: jest.fn(),
      load: jest.fn(),
      dimension: 1536,
      metric: 'cosine',
    })),
    vectorlitePath: jest.fn().mockReturnValue('/mock/path/to/vectorlite.so'),
  },
  vectorlitePath: jest.fn().mockReturnValue('/mock/path/to/vectorlite.so'),
}));

// Mock fs for VectorDB
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),  // Keep original fs functions
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  rmSync: jest.fn(),
})); 