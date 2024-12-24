import { z } from 'zod';

export const tweetSearchSchema = z.object({
  tweets: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      author_id: z.string(),
      author_username: z.string(),
      created_at: z.string(),
      thread: z
        .array(
          z.object({
            id: z.string(),
            text: z.string(),
            author_id: z.string(),
            author_username: z.string(),
            created_at: z.string(),
          }),
        )
        .optional(),
    }),
  ),
  lastProcessedId: z.string().nullable().optional(),
});

export const engagementSchema = z.object({
  shouldEngage: z.boolean(),
  reason: z.string(),
  priority: z.number().min(1).max(10),
  confidence: z.number().min(0).max(1),
});

export const toneSchema = z.object({
  dominantTone: z.string(),
  suggestedTone: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

export const responseSchema = z.object({
  content: z.string(),
  tone: z.string(),
  strategy: z.string(),
  estimatedImpact: z.number().min(1).max(10),
  confidence: z.number().min(0).max(1),
  referencedTweets: z
    .array(
      z.object({
        text: z.string(),
        reason: z.string(),
        similarity_score: z.number(),
      }),
    )
    .optional(),
  thread: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        author_id: z.string(),
        author_username: z.string(),
        created_at: z.string(),
      }),
    )
    .optional(),
  rejectionReason: z.string().optional(),
  suggestedChanges: z.string().optional(),
});

export const queueActionSchema = z.object({
  tweet: z.object({
    id: z.string(),
    text: z.string(),
    author_id: z.string(),
    author_username: z.string(),
    created_at: z.string(),
  }),
  reason: z.string().optional(),
  priority: z.number().optional(),
  workflowState: z.record(z.any()).optional(),
});

export const dsnUploadSchema = z.object({
  previousCid: z.string().optional(),
  data: z.any(),
});

export const autoApprovalSchema = z.object({
  approved: z.boolean(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  suggestedChanges: z.string().optional(),
});
