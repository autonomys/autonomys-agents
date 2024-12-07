import { DynamicStructuredTool } from '@langchain/core/tools';
import { createLogger } from '../../utils/logger.js';
import { v4 as generateId } from 'uuid';
import { queueActionSchema } from '../../schemas/workflow.js';
import { addResponse } from '../../services/database/index.js';
import { QueuedResponseMemory } from '../../types/queue.js';
import { Tweet } from '../../types/twitter.js';
import { AgentResponse } from '../../types/agent.js';
import { WorkflowState } from '../../types/workflow.js';


const logger = createLogger('queue-response-tool');

export const createQueueResponseTool = () => new DynamicStructuredTool({
    name: 'queue_response',
    description: 'Add a response to the approval queue',
    schema: queueActionSchema,
    func: async (input) => {
        try {
            const id = generateId();
            const response: QueuedResponseMemory = {
                id,
                tweet: <Tweet> input.tweet,
                response: <AgentResponse> {
                    content: input.workflowState?.responseStrategy?.content,
                },
                status: 'pending' as const,
                created_at: new Date(),
                updatedAt: new Date(),
                workflowState: <WorkflowState> input.workflowState
            };

            addResponse(response);
            return {
                success: true,
                id,
                type: 'response' as const,
                message: 'Response queued successfully'
            };
        } catch (error) {
            logger.error('Error queueing response:', error);
            throw error;
        }
    }
});