import { z } from 'zod';
import dotenv from 'dotenv';
import { configSchema } from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../..');

const cookiesDir = path.join(workspaceRoot, '.cookies');
try {
  await mkdir(cookiesDir, { recursive: true });
} catch (error) {
  console.error('Error creating cookies directory:', error);
}

dotenv.config({ path: path.resolve(workspaceRoot, '.env') });

function formatZodError(error: z.ZodError) {
  const missingVars = error.issues.map(issue => {
    const path = issue.path.join('.');
    return `- ${path}: ${issue.message}`;
  });
  return `Missing or invalid environment variables:
    \n${missingVars.join('\n')}
    \nPlease check your .env file and ensure all required variables are set correctly.`;
}

export const agentVersion = process.env.AGENT_VERSION || '1.0.0';

export const config = (() => {
  try {
    const username = process.env.TWITTER_USERNAME || '';
    const cookiesPath = path.join(cookiesDir, `${username}-cookies.json`);

    const rawConfig = {
      twitterConfig: {
        USERNAME: username,
        PASSWORD: process.env.TWITTER_PASSWORD || '',
        COOKIES_PATH: cookiesPath,
        NUM_TIMELINE_TWEETS: Number(process.env.NUM_TIMELINE_TWEETS) || 10,
        NUM_FOLLOWING_RECENT_TWEETS: Number(process.env.NUM_FOLLOWING_RECENT_TWEETS) || 10,
        NUM_RANDOM_FOLLOWERS: Number(process.env.NUM_RANDOM_FOLLOWERS) || 5,
        MAX_MENTIONS: Number(process.env.MAX_MENTIONS) || 5,
        MAX_THREAD_LENGTH: Number(process.env.MAX_THREAD_LENGTH) || 20,
        MAX_MY_RECENT_TWEETS: Number(process.env.MAX_MY_RECENT_TWEETS) || 10,
        MAX_MY_RECENT_REPLIES: Number(process.env.MAX_MY_RECENT_REPLIES) || 10,
        POST_TWEETS: process.env.POST_TWEETS === 'true',
        RESPONSE_INTERVAL_MINUTES: (Number(process.env.RESPONSE_INTERVAL_MINUTES) || 60) * 60 * 1000,
        POST_INTERVAL_MINUTES: (Number(process.env.POST_INTERVAL_MINUTES) || 90) * 60 * 1000,
      },
      llmConfig: {
        LARGE_LLM_MODEL: process.env.LARGE_LLM_MODEL || 'gpt-4o',
        SMALL_LLM_MODEL: process.env.SMALL_LLM_MODEL || 'gpt-4o-mini',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      },
      autoDriveConfig: {
        AUTO_DRIVE_API_KEY: process.env.AUTO_DRIVE_API_KEY,
        AUTO_DRIVE_ENCRYPTION_PASSWORD: process.env.AUTO_DRIVE_ENCRYPTION_PASSWORD,
        AUTO_DRIVE_UPLOAD: process.env.AUTO_DRIVE_UPLOAD === 'true',
      },
      blockchainConfig: {
        RPC_URL: process.env.RPC_URL || undefined,
        CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || undefined,
        PRIVATE_KEY: process.env.PRIVATE_KEY || undefined,
      },
      SERPAPI_API_KEY: process.env.SERPAPI_API_KEY || '',
      NODE_ENV: process.env.NODE_ENV || 'development',
      RETRY_LIMIT: Number(process.env.RETRY_LIMIT) || 2,
    };

    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\x1b[31m%s\x1b[0m', formatZodError(error));
      console.info(
        '\x1b[36m%s\x1b[0m',
        '\nTip: Copy .env.sample to .env and fill in the required values.',
      );
      process.exit(1);
    }
    throw error;
  }
})();

export type Config = z.infer<typeof configSchema>;
