import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('stop-workflow-tool');

export const createStopWorkflowTool = (
  workflowControlState: Map<string, object>,
  namespace: string,
) =>
  new DynamicStructuredTool({
    name: 'stop_workflow',
    description: `
    **Stop the workflow tool by providing a reason**
    
    INSTRUCTIONS:
    - This is an expensive tool. You should use it when you are 100% sure that you have completed all tasks. Otherwise, you will be penalized.
    - You should use this tool when you have done everything possible with your available tools
    - or when you face tool limitations, or when you need to wait for anything, or when you've scheduled appropriate follow-ups.
    - Also use this tool when you find yourself in a loop (repeatedly doing the same thing).
    `,
    schema: z.object({
      reason: z.string().describe(`Reason for stopping the workflow`),
    }),
    func: async ({ reason }: { reason: string }) => {
      logger.info('Stopping workflow', { reason });
      try {
        workflowControlState.set(namespace, { shouldStop: true, reason: reason });
        return {
          success: true,
          message: 'Workflow stopped',
        };
      } catch (error) {
        logger.error('Failed to report issue', { error });
        return {
          success: false,
          message: `Failed to report issue: ${error}`,
        };
      }
    },
  });
