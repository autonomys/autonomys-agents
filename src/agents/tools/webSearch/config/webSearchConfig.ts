import { z } from 'zod';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/utils.js';

const configSchema = z.object({
  web_search: z.object({
    default_results: z.number(),
    engine: z.enum(['google']),
    api: z.object({
      api_key: z.string(),
      enabled: z.boolean(),
      timeout_ms: z.number(),
    }),
  }),
});


const defaultConfig = {
  web_search: {
    default_results: 5,
    engine: 'google' as const,
    api: {
      api_key: null,
      enabled: true,
      timeout_ms: 10000,
    },
  },
};


function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'webSearch.config.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(fileContents);
    return configSchema.parse(parsed);
  } catch (error) {
    logger.warn('Using default web search config', { error });
    return defaultConfig;
  }
}

export const webSearchConfig = loadConfig(); 