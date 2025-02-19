import { z } from 'zod';
import { NetworkId } from '@autonomys/auto-utils';

const twitterConfigSchema = z.object({
  USERNAME: z.string().min(1, 'Twitter username is required'),
  PASSWORD: z.string().min(1, 'Twitter password is required'),
  COOKIES_PATH: z.string(),
  POST_TWEETS: z.boolean().default(false),
});

const llmConfigSchema = z.object({
  OPENAI_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  LLAMA_API_URL: z.string(),
  DEEPSEEK_URL: z.string(),
  DEEPSEEK_API_KEY: z.string(),
  GROQ_API_KEY: z.string(),
});

const autoDriveConfigSchema = z.object({
  AUTO_DRIVE_API_KEY: z.string().optional(),
  AUTO_DRIVE_ENCRYPTION_PASSWORD: z.string().optional(),
  AUTO_DRIVE_NETWORK: z
    .enum(['mainnet', 'taurus'])
    .transform(val => NetworkId[val.toUpperCase() as 'MAINNET' | 'TAURUS'])
    .default('taurus'),
  AUTO_DRIVE_UPLOAD: z.boolean().default(true),
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

const characterConfigSchema = z.object({
  name: z.string(),
  characterPath: z.string(),
  goal: z.string(),
  personality: z.array(z.string()),
  expertise: z.array(z.string()),
  communicationRules: z.object({
    rules: z.array(z.string()),
    wordsToAvoid: z.array(z.string()),
  }),
});

const memoryConfigSchema = z.object({
  MAX_PROCESSED_IDS: z.number().int().positive().default(5000),
});

const orchestratorConfigSchema = z.object({
  MAX_WINDOW_SUMMARY: z.number().int().positive().default(20),
  MAX_QUEUE_SIZE: z.number().int().positive().default(50),
});

const SERPAPI_API_KEY = z.string().optional();

export const configSchema = z.object({
  twitterConfig: twitterConfigSchema,
  llmConfig: llmConfigSchema,
  autoDriveConfig: autoDriveConfigSchema,
  blockchainConfig: blockchainConfigSchema,
  memoryConfig: memoryConfigSchema,
  characterConfig: characterConfigSchema,
  orchestratorConfig: orchestratorConfigSchema,
  SERPAPI_API_KEY: SERPAPI_API_KEY,
  NODE_ENV: z.enum(['development', 'production', 'test']),
});
