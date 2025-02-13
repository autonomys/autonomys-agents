import { z } from 'zod';
import dotenv from 'dotenv';
import { configSchema } from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { loadCharacter } from './characters.js';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../..');

const cookiesDir = path.join(workspaceRoot, '.cookies');
try {
  await mkdir(cookiesDir, { recursive: true });
} catch (error) {
  console.error('Error creating cookies directory:', error);
}

export const characterName = process.argv[2];
if (!characterName) {
  console.error('Please provide a character name');
  // Force immediate exit of the entire process group
  process.kill(0, 'SIGKILL');
}

const characterConfig = loadCharacter(characterName);
// Load root .env
dotenv.config({ path: path.resolve(workspaceRoot, '.env') });

// Load character-specific .env if it exists, overriding root .env values
const characterEnvPath = characterName
  ? path.resolve(characterConfig.characterPath, 'config', '.env')
  : null;
if (characterEnvPath && existsSync(characterEnvPath)) {
  dotenv.config({ path: characterEnvPath });
}

const formatZodError = (error: z.ZodError) => {
  const missingVars = error.issues.map(issue => {
    const path = issue.path.join('.');
    return `- ${path}: ${issue.message}`;
  });
  return `Missing or invalid environment variables:
    \n${missingVars.join('\n')}
    \nPlease check your .env file and config.yaml file and ensure all required variables are set correctly.`;
};

export const agentVersion = (() => {
  try {
    const packageJson = JSON.parse(readFileSync(path.join(workspaceRoot, 'package.json'), 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json version:', error);
    return '0.0.0';
  }
})();

const configYaml = yaml.parse(
  readFileSync(path.join(characterConfig.characterPath, 'config', 'config.yaml'), 'utf8'),
);

export const config = (() => {
  try {
    const username = process.env.TWITTER_USERNAME || '';
    const cookiesPath = path.join(cookiesDir, `${username}-cookies.json`);

    const rawConfig = {
      twitterConfig: {
        USERNAME: username,
        PASSWORD: process.env.TWITTER_PASSWORD || '',
        COOKIES_PATH: cookiesPath,
        POST_TWEETS: configYaml.twitter.post_tweets,
      },

      characterConfig,

      llmConfig: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        LLAMA_API_URL: process.env.LLAMA_API_URL || '',
        DEEPSEEK_URL: process.env.DEEPSEEK_URL || '',
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
      },

      autoDriveConfig: {
        AUTO_DRIVE_API_KEY: process.env.AUTO_DRIVE_API_KEY,
        AUTO_DRIVE_ENCRYPTION_PASSWORD: process.env.AUTO_DRIVE_ENCRYPTION_PASSWORD,
        AUTO_DRIVE_NETWORK: configYaml.auto_drive.network,
        AUTO_DRIVE_UPLOAD: configYaml.auto_drive.upload,
      },

      blockchainConfig: {
        RPC_URL: process.env.RPC_URL || undefined,
        CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || undefined,
        PRIVATE_KEY: process.env.PRIVATE_KEY || undefined,
      },

      memoryConfig: {
        MAX_PROCESSED_IDS: 5000,
      },

      orchestratorConfig: {
        MAX_WINDOW_SUMMARY: 20,
        MAX_QUEUE_SIZE: 50,
      },

      NODE_ENV: process.env.NODE_ENV || 'development',

      SERPAPI_API_KEY: process.env.SERPAPI_API_KEY || '',
    };
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\x1b[31m%s\x1b[0m', formatZodError(error));
      console.info(
        '\x1b[36m%s\x1b[0m',
        '\nTip: Copy .env.sample to .env and fill/change the required values.',
      );
      process.exit(1);
    }
    throw error;
  }
})();

export type Config = z.infer<typeof configSchema>;
