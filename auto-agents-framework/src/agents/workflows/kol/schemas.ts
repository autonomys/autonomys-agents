import { z } from 'zod';

export const engagementSchema = z.object({
  shouldEngage: z.boolean(),
  reason: z.string(),
});

export const responseSchema = z.object({
  content: z.string().describe('The response to the tweet'),
  strategy: z.string().describe('The strategy used to generate the response'),
  thread: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        username: z.string(),
      }),
    )
    .optional(),
});

export const dsnUploadSchema = z.object({
  previousCid: z.string().optional(),
  data: z.any(),
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
