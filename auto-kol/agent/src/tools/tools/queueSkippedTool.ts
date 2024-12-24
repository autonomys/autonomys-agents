import { DynamicStructuredTool } from '@langchain/core/tools';
import { createLogger } from '../../utils/logger.js';
import { v4 as generateId } from 'uuid';
import { queueActionSchema } from '../../schemas/workflow.js';
import { addToSkipped } from '../../services/database/index.js';

const logger = createLogger('queue-skipped-tool');

export const createQueueSkippedTool = () =>
  new DynamicStructuredTool({
    name: 'queue_skipped',
    description: 'Add a skipped tweet to the review queue',
    schema: queueActionSchema,
    func: async input => {
      try {
        const id = generateId();
        const skippedTweet = {
          id,
          tweet: input.tweet,
          reason: input.reason || 'No reason provided',
          priority: input.priority || 0,
          created_at: new Date(),
          workflowState: input.workflowState,
        };

        logger.info('Queueing skipped tweet:', {
          skippedTweet,
        });

        addToSkipped(skippedTweet);

        logger.info('Successfully queued skipped tweet:', { id });

        return {
          success: true,
          id,
          type: 'skipped' as const,
          message: 'Tweet queued for review',
        };
      } catch (error) {
        logger.error('Error queueing skipped tweet:', error);
        throw error;
      }
    },
  });
