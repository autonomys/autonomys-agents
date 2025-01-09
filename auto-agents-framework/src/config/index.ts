import { z } from 'zod';
import dotenv from 'dotenv';
import { configSchema } from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';
import { llmDefaultConfig } from './llm.js';
import { twitterDefaultConfig } from './twitter.js';
import yaml from 'yaml';
import { readFileSync } from 'fs';

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

const yamlConfig = (() => {
  try {
    const configPath = path.join(workspaceRoot, 'config', 'config.yaml');
    const fileContents = readFileSync(configPath, 'utf8');
    return yaml.parse(fileContents);
  } catch (error) {
    console.info('No YAML config found, falling back to environment variables');
    return {};
  }
})();

export const config = (() => {
  try {
    const username = process.env.TWITTER_USERNAME || '';
    const cookiesPath = path.join(cookiesDir, `${username}-cookies.json`);

    const rawConfig = {
      twitterConfig: {
        USERNAME: username,
        PASSWORD: process.env.TWITTER_PASSWORD || '',
        COOKIES_PATH: cookiesPath,
        ...twitterDefaultConfig,
        ...(yamlConfig.twitter || {}),
      },
      llmConfig: {
        ...llmDefaultConfig,
        ...(yamlConfig.llm || {}),
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        LLAMA_API_URL: process.env.LLAMA_API_URL || '',
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
