import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the equivalent of __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const twitterConfig = {
  USERNAME: process.env.TWITTER_USERNAME || '',
  PASSWORD: process.env.TWITTER_PASSWORD || '',
  COOKIES_PATH: process.env.TWITTER_COOKIES_PATH || 'cookies.json',
  POST_TWEETS: process.env.POST_TWEETS === 'true',
};

const llmConfig = {
  LARGE_LLM_MODEL: process.env.LARGE_LLM_MODEL || 'gpt-4o',
  SMALL_LLM_MODEL: process.env.SMALL_LLM_MODEL || 'gpt-4o-mini',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
};

const autoDriveConfig = {
  AUTO_DRIVE_API_KEY: process.env.AUTO_DRIVE_API_KEY,
  AUTO_DRIVE_ENCRYPTION_PASSWORD: process.env.AUTO_DRIVE_ENCRYPTION_PASSWORD,
  AUTO_DRIVE_UPLOAD: process.env.AUTO_DRIVE_UPLOAD === 'true',
};

export const config = {
  twitterConfig,
  llmConfig,
  autoDriveConfig,

  // Agent Configuration
  CHECK_INTERVAL: (Number(process.env.CHECK_INTERVAL_MINUTES) || 30) * 60 * 1000,
  MEMORY_DIR: path.join(__dirname, '../../data/memory'),

  // Server Configuration
  PORT: process.env.PORT || 3001,

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Chroma Configuration
  CHROMA_DIR: path.join(__dirname, '../../data/chroma'),
  CHROMA_URL: process.env.CHROMA_URL || 'http://localhost:8000',

  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS,

  // SC Configuration
  RPC_URL: process.env.RPC_URL,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  WALLET_ADDRESS: process.env.WALLET_ADDRESS,

  // Tweet Search/Fetch Configuration
  ACCOUNTS_PER_BATCH: Number(process.env.ACCOUNTS_PER_BATCH) || 10,
  MAX_SEARCH_TWEETS: Number(process.env.MAX_SEARCH_TWEETS) || 20,
  MAX_MENTIONS: Number(process.env.MAX_MENTIONS) || 5,
  MAX_THREAD_LENGTH: Number(process.env.MAX_THREAD_LENGTH) || 20,

  // BATCH CONFIG
  ENGAGEMENT_BATCH_SIZE: process.env.ENGAGEMENT_BATCH_SIZE || 15,

  // RESPONSE CONFIG
  RETRY_LIMIT: process.env.RETRY_LIMIT || 2,

  // TOP LEVEL TWEET CONFIG
  TOP_LEVEL_TWEET_INTERVAL_MINUTES: Number(process.env.TOP_LEVEL_TWEET_INTERVAL_MINUTES) || 120,
};
