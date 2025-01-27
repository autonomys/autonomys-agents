import { z } from 'zod';
import { LLMProvider, LLMSize } from '../services/llm/types.js';

const twitterConfigSchema = z.object({
  USERNAME: z.string().min(1, 'Twitter username is required'),
  PASSWORD: z.string().min(1, 'Twitter password is required'),
  COOKIES_PATH: z.string(),
  NUM_TIMELINE_TWEETS: z.number().int().min(0),
  NUM_FOLLOWING_RECENT_TWEETS: z.number().int().min(0),
  NUM_RANDOM_FOLLOWINGS: z.number().int().min(0),
  MAX_MENTIONS: z.number().int().min(0),
  MAX_THREAD_LENGTH: z.number().int().min(0),
  MAX_MY_RECENT_TWEETS: z.number().int().min(0),
  MAX_MY_RECENT_REPLIES: z.number().int().min(0),
  POST_TWEETS: z.boolean(),
  RESPONSE_INTERVAL_MS: z.number().int().positive(),
  POST_INTERVAL_MS: z.number().int().positive(),
});

const llmConfigSchema = z
  .object({
    configuration: z.object({
      large: z.object({
        provider: z.nativeEnum(LLMProvider),
        model: z.string(),
      }),
      small: z.object({
        provider: z.nativeEnum(LLMProvider),
        model: z.string(),
      }),
    }),
    nodes: z.object({
      decision: z.object({
        size: z.nativeEnum(LLMSize),
        temperature: z.number(),
      }),
      analyze: z.object({
        size: z.nativeEnum(LLMSize),
        temperature: z.number(),
      }),
      generation: z.object({
        size: z.nativeEnum(LLMSize),
        temperature: z.number(),
      }),
      response: z.object({
        size: z.nativeEnum(LLMSize),
        temperature: z.number(),
      }),
      orchestrator: z.object({
        size: z.nativeEnum(LLMSize),
        temperature: z.number(),
      }),
    }),
    OPENAI_API_KEY: z.string(),
    ANTHROPIC_API_KEY: z.string(),
    LLAMA_API_URL: z.string(),
    DEEPSEEK_URL: z.string(),
    DEEPSEEK_API_KEY: z.string(),
  })
  .superRefine((data, ctx) => {
    const providers = new Set([
      data.nodes.decision.size === LLMSize.LARGE
        ? data.configuration.large.provider
        : data.configuration.small.provider,
      data.nodes.analyze.size === LLMSize.LARGE
        ? data.configuration.large.provider
        : data.configuration.small.provider,
      data.nodes.generation.size === LLMSize.LARGE
        ? data.configuration.large.provider
        : data.configuration.small.provider,
      data.nodes.response.size === LLMSize.LARGE
        ? data.configuration.large.provider
        : data.configuration.small.provider,
      data.nodes.orchestrator.size === LLMSize.LARGE
        ? data.configuration.large.provider
        : data.configuration.small.provider,
    ]);

    const missingConfigs = [];

    if (providers.has(LLMProvider.OPENAI) && !data.OPENAI_API_KEY) {
      missingConfigs.push('OpenAI API key');
    }
    if (providers.has(LLMProvider.ANTHROPIC) && !data.ANTHROPIC_API_KEY) {
      missingConfigs.push('Anthropic API key');
    }
    if (providers.has(LLMProvider.OLLAMA) && !data.LLAMA_API_URL) {
      missingConfigs.push('Llama API URL');
    }

    if (missingConfigs.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing required configs: ${missingConfigs.join(', ')}`,
        path: ['llmConfig'],
      });
    }
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

const characterConfigSchema = z.object({
  name: z.string(),
  characterPath: z.string(),
  description: z.string(),
  personality: z.array(z.string()),
  expertise: z.array(z.string()),
  communicationRules: z.object({
    rules: z.array(z.string()),
    wordsToAvoid: z.array(z.string()),
  }),
  twitterProfile: z.object({
    username: z.string(),
    trendFocus: z.array(z.string()),
    contentFocus: z.array(z.string()),
    engagementCriteria: z.array(z.string()),
    replyStyle: z.array(z.string()),
  }),
});

const memoryConfigSchema = z.object({
  MAX_PROCESSED_IDS: z.number().int().positive().default(5000),
});

const SERPAPI_API_KEY = z.string().optional();

export const configSchema = z.object({
  twitterConfig: twitterConfigSchema,
  llmConfig: llmConfigSchema,
  autoDriveConfig: autoDriveConfigSchema,
  blockchainConfig: blockchainConfigSchema,
  memoryConfig: memoryConfigSchema,
  characterConfig: characterConfigSchema,
  SERPAPI_API_KEY: SERPAPI_API_KEY,
  NODE_ENV: z.enum(['development', 'production', 'test']),
});
