import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { z } from 'zod';
import { loadCharacter } from './characters.js';
import { configSchema } from './schema.js';

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

const yamlConfig = (() => {
  try {
    const characterConfigPath = path.join(characterConfig.characterPath, 'config', 'config.yaml');
    const fileContents = readFileSync(characterConfigPath, 'utf8');
    return yaml.parse(fileContents);
  } catch (error) {
    console.error('No YAML config found for character', characterName, error);
    return {};
  }
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertModelConfigurations = (modelConfigurations: any) => {
  if (!modelConfigurations) {
    return {
      inputModelConfig: undefined,
      messageSummaryModelConfig: undefined,
      finishWorkflowModelConfig: undefined,
    };
  }

  return {
    inputModelConfig: modelConfigurations.input_model_config,
    messageSummaryModelConfig: modelConfigurations.message_summary_model_config,
    finishWorkflowModelConfig: modelConfigurations.finish_workflow_model_config,
  };
};

export const config = (() => {
  try {
    const username = process.env.TWITTER_USERNAME || '';
    const cookiesPath = path.join(cookiesDir, `${username}-cookies.json`);

    const rawConfig = {
      twitterConfig: {
        USERNAME: username,
        PASSWORD: process.env.TWITTER_PASSWORD || '',
        COOKIES_PATH: cookiesPath,
        POST_TWEETS: yamlConfig.twitter.post_tweets ?? false,
        model_configurations: convertModelConfigurations(yamlConfig.twitter.model_configurations),
      },

      characterConfig,

      slackConfig: {
        SLACK_APP_TOKEN: process.env.SLACK_APP_TOKEN || '',
      },

      githubConfig: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
        GITHUB_OWNER: process.env.GITHUB_OWNER || '',
        GITHUB_REPO: process.env.GITHUB_REPO || '',
      },

      notionConfig: {
        NOTION_TOKEN: process.env.NOTION_TOKEN || '',
        NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID || '',
      },

      llmConfig: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        LLAMA_API_URL: process.env.LLAMA_API_URL || '',
        DEEPSEEK_URL: process.env.DEEPSEEK_URL || '',
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
        GROQ_API_KEY: process.env.GROQ_API_KEY || '',
      },

      autoDriveConfig: {
        AUTO_DRIVE_API_KEY: process.env.AUTO_DRIVE_API_KEY,
        AUTO_DRIVE_ENCRYPTION_PASSWORD: process.env.AUTO_DRIVE_ENCRYPTION_PASSWORD,
        AUTO_DRIVE_NETWORK: yamlConfig.auto_drive.network ?? 'taurus',
        AUTO_DRIVE_MONITORING: yamlConfig.auto_drive.monitoring ?? false,
        AUTO_DRIVE_SAVE_EXPERIENCES: yamlConfig.auto_drive.save_experiences ?? false,
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
        model_configurations: convertModelConfigurations(
          yamlConfig.orchestrator?.model_configurations,
        ),
      },

      NODE_ENV: process.env.NODE_ENV || 'development',

      SERPAPI_API_KEY: process.env.SERPAPI_API_KEY || '',

      API_PORT: process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 3001,
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
