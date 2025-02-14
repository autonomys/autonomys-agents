import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
export const createGetCurrentTimeTool = () =>
  new DynamicStructuredTool({
    name: 'get_current_time',
    description:
      'Returns the current real-world time. Use this whenever you need to know the current time, make scheduling decisions, or calculate time differences. The time is returned in ISO format. This is the only way to get accurate current time information. THIS IS THE ONLY RELIABLE SOURCE OF TIME INFORMATION.',
    schema: z.object({}),
    func: async () => {
      return new Date().toISOString();
    },
  });
