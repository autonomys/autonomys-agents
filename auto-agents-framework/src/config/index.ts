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
  NUM_TIMELINE_TWEETS: Number(process.env.NUM_TIMELINE_TWEETS) || 10,
  NUM_FOLLOWING_RECENT_TWEETS: Number(process.env.NUM_FOLLOWING_RECENT_TWEETS) || 10,
  NUM_RANDOM_FOLLOWERS: Number(process.env.NUM_RANDOM_FOLLOWERS) || 5,
  MAX_MENTIONS: Number(process.env.MAX_MENTIONS) || 5,
  MAX_THREAD_LENGTH: Number(process.env.MAX_THREAD_LENGTH) || 20,
  MAX_MY_RECENT_TWEETS: Number(process.env.MAX_MY_RECENT_TWEETS) || 10,
  POST_TWEETS: process.env.POST_TWEETS === 'true',
  RESPONSE_INTERVAL_MS: Number(process.env.RESPONSE_INTERVAL_MINUTES) * 60 * 1000 || 26 * 60 * 1000,
  POST_INTERVAL_MS: Number(process.env.POST_INTERVAL_MINUTES) * 60 * 1000 || 30 * 60 * 1000,
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
  // SC Configuration
  RPC_URL: process.env.RPC_URL,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  WALLET_ADDRESS: process.env.WALLET_ADDRESS,
};

export const config = {
  twitterConfig,
  llmConfig,
  autoDriveConfig,

  // Server Configuration
  PORT: process.env.PORT || 3001,

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',

  // RESPONSE CONFIG
  RETRY_LIMIT: process.env.RETRY_LIMIT || 2,
};
