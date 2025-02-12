import { z } from 'zod';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/utils.js';

const configSchema = z.object({
  post_tweets: z.boolean(),
  timeline: z.object({
    num_timeline_tweets: z.number(),
    num_following_tweets: z.number(),
  }),
  mentions: z.object({
    max_mentions: z.number(),
  }),
  my_tweets: z.object({
    max_recent_tweets: z.number(),
    max_recent_replies: z.number(),
  }),
  search: z.object({
    default_count: z.number(),
  }),
  following: z.object({
    num_following: z.number(),
  }),
});

const defaultConfig = {
  post_tweets: false,
  timeline: {
    num_timeline_tweets: 20,
    num_following_tweets: 20,
  },
  mentions: {
    max_mentions: 10,
  },
  my_tweets: {
    max_recent_tweets: 20,
    max_recent_replies: 20,
  },
  search: {
    default_count: 30,
  },
  following: {
    num_following: 50,
  },
};
function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'twitter.config.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(fileContents);
    return configSchema.parse(parsed);
  } catch (error) {
    logger.warn('Using default Twitter config');
    return defaultConfig;
  }
}

export const twitterConfig = loadConfig();
