import { DynamicStructuredTool } from '@langchain/core/tools';
import { createLogger } from '../../utils/logger.js';
import { v4 as generateId } from 'uuid';
import { queueActionSchema } from '../../schemas/workflow.js';
import { addResponse } from '../../services/database/index.js';
import { getResponseByTweetId, updateResponse } from '../../database/index.js';
import { PendingResponse, QueuedResponseMemory } from '../../types/queue.js';
import { Tweet } from '../../types/twitter.js';
import { AgentResponse } from '../../types/agent.js';
import { WorkflowState } from '../../types/workflow.js';


const logger = createLogger('queue-response-tool');

export const createQueueResponseTool = () => new DynamicStructuredTool({
    name: 'queue_response',
    description: 'Add or update a response in the approval queue',
    schema: queueActionSchema,
    func: async (input: any) => {

        try {
            if (input?.fromAutoApproval) {
                const existingResponse = await getResponseByTweetId(input.tweet.id);
                
                if (!existingResponse) {
                    logger.error('Could not find existing response to update:', {
                        tweet_id: input.tweet.id
                    });
                    throw new Error('Could not find existing response to update');
                }

                await updateResponse({
                    id: existingResponse.id,
                    tweet_id: input.tweet.id,
                    content: input.workflowState.responseStrategy.content,
                    tone: input.workflowState.responseStrategy.tone,
                    strategy: input.workflowState.responseStrategy.strategy,
                    estimatedImpact: input.workflowState.responseStrategy.estimatedImpact,
                    confidence: input.workflowState.responseStrategy.confidence,
                } as PendingResponse);


                return {
                    success: true,
                    id: existingResponse.id,
                    type: 'response' as const,
                    message: 'Response updated successfully'
                };
            }

            const id = generateId();
            const response: QueuedResponseMemory = {
                id,
                tweet: <Tweet>input.tweet,
                response: <AgentResponse>{
                    content: input.workflowState?.responseStrategy?.content,
                },
                status: 'pending' as const,
                created_at: new Date(),
                updatedAt: new Date(),
                workflowState: <WorkflowState>input.workflowState
            };

            await addResponse(response);
            return {
                success: true,
                id,
                type: 'response' as const,
                message: 'Response queued successfully'
            };
        } catch (error) {
            logger.error('Error in queue response tool:', error);
            throw error;
        }
    }
});