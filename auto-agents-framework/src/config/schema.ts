import { z } from 'zod';

const twitterConfigSchema = z.object({
  USERNAME: z.string().min(1, 'Twitter username is required'),
  PASSWORD: z.string().min(1, 'Twitter password is required'),
  COOKIES_PATH: z.string(),
  NUM_TIMELINE_TWEETS: z.number().int().positive(),
  NUM_FOLLOWING_RECENT_TWEETS: z.number().int().positive(),
  NUM_RANDOM_FOLLOWERS: z.number().int().positive(),
  MAX_MENTIONS: z.number().int().positive(),
  MAX_THREAD_LENGTH: z.number().int().positive(),
  MAX_MY_RECENT_TWEETS: z.number().int().positive(),
  POST_TWEETS: z.boolean(),
  RESPONSE_INTERVAL_MS: z.number().int().positive(),
  POST_INTERVAL_MS: z.number().int().positive(),
});

const llmConfigSchema = z.object({
  LARGE_LLM_MODEL: z.string().min(1),
  SMALL_LLM_MODEL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
});

const autoDriveConfigSchema = z.object({
  AUTO_DRIVE_API_KEY: z.string().optional(),
  AUTO_DRIVE_ENCRYPTION_PASSWORD: z.string().optional(),
  AUTO_DRIVE_UPLOAD: z.boolean(),
});

const blockchainConfigSchema = z.object({
  RPC_URL: z.string().optional(),
  CONTRACT_ADDRESS: z.union([
    z
      .string()
      .regex(
        /^0x[0-9a-fA-F]{40}$/,
        "Contract address must be a 42-character string: '0x' prefix followed by 40 hex characters",
      )
      .refine(
        val => val.length === 42,
        'Contract address must be exactly 42 characters (0x + 40 hex characters)',
      ),
    z.literal(''),
    z.literal(undefined),
  ]),
  PRIVATE_KEY: z.union([
    z
      .string()
      .regex(
        /^0x[0-9a-fA-F]{64}$/,
        "Private key must be a 66-character string: '0x' prefix followed by 64 hex characters",
      )
      .refine(
        val => val.length === 66,
        'Private key must be exactly 66 characters (0x + 64 hex characters)',
      ),
    z.literal(''),
    z.literal(undefined),
  ]),
});

const SERPAPI_API_KEY = z.string().optional();

export const configSchema = z.object({
  twitterConfig: twitterConfigSchema,
  llmConfig: llmConfigSchema,
  autoDriveConfig: autoDriveConfigSchema,
  blockchainConfig: blockchainConfigSchema,
  SERPAPI_API_KEY: SERPAPI_API_KEY,
  NODE_ENV: z.enum(['development', 'production', 'test']),
  RETRY_LIMIT: z.number().int().nonnegative(),
});
