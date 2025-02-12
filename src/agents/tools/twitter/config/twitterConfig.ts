import { z } from 'zod';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

const configSchema = z.object({
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

function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'twitter.config.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(fileContents);
    return configSchema.parse(parsed);
  } catch (error) {
    console.warn('Using default Twitter config');
  }
}

export const twitterConfig = loadConfig(); 