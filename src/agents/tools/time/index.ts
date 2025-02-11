import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const createGetCurrentTimeTool = () =>
  new DynamicStructuredTool({
    name: 'get_current_time',
    description:
      'Returns the current real-world time. Use this whenever you need to know the current time, make scheduling decisions, or calculate time differences. The time is returned in ISO format. THIS IS THE ONLY RELIABLE SOURCE OF TIME INFORMATION.',
    // Add a dummy property so the object schema is non-empty.
    schema: z.object({
      // Dummy parameter; it is optional and not used by the tool.
      dummy: z.string().optional(),
    }),
    func: async () => {
      return new Date().toISOString();
    },
  });
