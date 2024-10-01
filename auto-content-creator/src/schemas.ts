import { z } from 'zod';

export const generationSchema = z.object({
  content: z.string().describe('The main content generated based on the given instructions.'),
  other: z.string().optional().describe('Any additional commentary or metadata about the generated content.'),
});

export const reflectionSchema = z.object({
  critique: z.string().describe('Detailed critique and recommendations for the content.'),
  score: z.number().min(1).max(10).describe('Reflection score between 1 and 10.'),
});

export const researchDecisionSchema = z.object({
  decision: z.enum(['yes', 'no']).describe('Whether to perform research or not.'),
  reason: z.string().describe('Reason for the decision.'),
});
