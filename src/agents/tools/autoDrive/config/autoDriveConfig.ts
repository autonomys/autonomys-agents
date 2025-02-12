import { z } from 'zod';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/utils.js';

const configSchema = z.object({
  auto_drive: z.object({
    upload: z.boolean(),
    network: z.enum(['taurus', 'mainnet']),
  }),
});

const defaultConfig = {
  auto_drive: {
    upload: false,
    network: 'taurus' as const,
  },
};

function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'autoDrive.config.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(fileContents);
    return configSchema.parse(parsed);
  } catch (error) {
    logger.warn('Using default auto drive config', { error });
    return defaultConfig;
  }
}

export const autoDriveConfig = loadConfig();
