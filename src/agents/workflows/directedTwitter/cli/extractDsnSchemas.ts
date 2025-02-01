import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { TwitterDsnDataType } from '../types.js';
import { dsnTweet, engagementSchema, responseSchema, skippedEngagementSchema } from '../schemas.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('extractDsnSchemas');

const dsnCommonFields = z.object({
  previousCid: z.string().optional(),
  signature: z.string(),
  timestamp: z.string(),
  agentVersion: z.string(),
});

const extractDsnResponseSchema = () => {
  const schema = z
    .object({
      type: z.literal(TwitterDsnDataType.RESPONSE),
      tweet: dsnTweet,
      decision: engagementSchema,
    })
    .merge(responseSchema)
    .merge(dsnCommonFields);

  return zodToJsonSchema(schema);
};

const extractDsnSkippedEngagementSchema = () => {
  const schema = z
    .object({
      type: z.literal(TwitterDsnDataType.SKIPPED_ENGAGEMENT),
      tweet: dsnTweet,
    })
    .merge(skippedEngagementSchema)
    .merge(dsnCommonFields);

  return zodToJsonSchema(schema);
};

const extractDsnGeneratedTweetSchema = () => {
  const schema = z
    .object({
      type: z.literal(TwitterDsnDataType.GENERATED_TWEET),
      content: z.string(),
      tweetId: z.string().nullable(),
    })
    .merge(dsnCommonFields);

  return zodToJsonSchema(schema);
};

const main = () => {
  const schemas = {
    response: extractDsnResponseSchema(),
    skipped_engagement: extractDsnSkippedEngagementSchema(),
    generated_tweet: extractDsnGeneratedTweetSchema(),
  };

  const outputPath = join(process.cwd(), 'dsn-twitter-schemas.json');
  writeFileSync(outputPath, JSON.stringify(schemas, null, 2));
  logger.info(`Schemas written to ${outputPath}`);
};

main();
