import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const createThinkingTool = () =>
  new DynamicStructuredTool({
    name: 'thinking',
    description:
      "Use this tool to reflect on what you've learned so far, analyze your options, and plan your next steps. This is a space for you to organize your thoughts before taking action. It allows you to reason step by step about complex problems, evaluate pros and cons of different approaches, and determine the best course of action based on available information. No external action is taken when you use this tool - it's purely for your internal reasoning process.",
    schema: z.object({
      thoughts: z.string().describe('Your detailed thought process, analysis, and reasoning'),
    }),
    func: async ({ thoughts }: { thoughts: string }) => {
      return {
        success: true,
        message: 'Great job taking a step back and thinking through the problem!',
      };
    },
  });
