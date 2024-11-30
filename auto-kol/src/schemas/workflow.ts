import { z } from 'zod';

export const tweetSearchSchema = z.object({
    tweets: z.array(z.object({
        id: z.string(),
        text: z.string(),
        authorId: z.string(),
        createdAt: z.string()
    })),
    lastProcessedId: z.string().nullable().optional()
});

export const engagementSchema = z.object({
    shouldEngage: z.boolean(),
    reason: z.string(),
    priority: z.number().min(1).max(10),
    confidence: z.number().min(0).max(1)
});

export const toneSchema = z.object({
    dominantTone: z.string(),
    suggestedTone: z.string(),
    reasoning: z.string(),
    confidence: z.number().min(0).max(1)
});

export const responseSchema = z.object({
    content: z.string(),
    tone: z.string(),
    strategy: z.string(),
    estimatedImpact: z.number().min(1).max(10),
    confidence: z.number().min(0).max(1)
});

export const queueActionSchema = z.object({
    tweet: z.any(),
    response: z.string(),
    workflowState: z.any(),
    reason: z.string().optional(),
    priority: z.number().optional()
}); 