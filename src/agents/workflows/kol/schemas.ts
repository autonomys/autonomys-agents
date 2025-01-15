import { z } from 'zod';

export const dsnTweet: z.ZodType = z.object({
  id: z.string(),
  text: z.string(),
  username: z.string(),
  timeParsed: z.string(),
  thread: z.array(z.lazy(() => dsnTweet)).optional(),
  quotedTweet: z.lazy(() => dsnTweet).optional(),
});

export const engagementSchema = z.object({
  shouldEngage: z.boolean(),
  reason: z.string().optional(),
});

export const responseSchema = z.object({
  content: z.string().describe('The response to the tweet'),
  strategy: z.string().describe('The strategy used to generate the response'),
});

export const skippedEngagementSchema = z.object({
  decision: engagementSchema,
});

export const dsnUploadSchema = z.object({
  data: z.any(),
  signature: z.string(),
  previousCid: z.string().optional(),
});

export const trendSchema = z.object({
  trends: z.array(
    z.object({
      topic: z.string(),
      description: z.string(),
      trendStrength: z.number().min(0).max(1),
    }),
  ),
  summary: z.string(),
});

export const trendTweetSchema = z.object({
  tweet: z.string(),
  reasoning: z.string(),
});

export const summarySchema = z.object({
  patterns: z.array(z.string()),
  commonWords: z.array(z.string()),
});
