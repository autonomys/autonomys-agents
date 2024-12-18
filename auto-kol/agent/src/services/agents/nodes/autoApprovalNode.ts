import { AIMessage } from "@langchain/core/messages";
import { State, logger } from '../workflow.js';
import * as prompts from '../prompts.js';
import { WorkflowConfig } from '../workflow.js';
import { getPendingResponses, updateResponseStatus } from '../../../database/index.js';

export const createAutoApprovalNode = (config: WorkflowConfig) => {
    return async (state: typeof State.State) => {
        logger.info('Auto Approval Node - Evaluating pending responses');
        try {
            const pendingResponses = await getPendingResponses();
            if (!pendingResponses.length) {
                logger.info('No pending responses found');
                return {
                    messages: [new AIMessage({
                        content: JSON.stringify({
                            fromAutoApproval: true,
                            batchToRespond: []
                        })
                    })]
                };
            }

            const processedResponses = [];

            for (const response of pendingResponses) {
                const approval = await prompts.autoApprovalPrompt
                    .pipe(config.llms.decision)
                    .pipe(prompts.autoApprovalParser)
                    .invoke({
                        tweet: response.tweet_content,
                        response: response.content,
                        tone: response.tone,
                        strategy: response.strategy
                    });
                
                if (approval.approved) {
                    // POST THE TWEET

                    await updateResponseStatus(response.id, 'approved');
                } else {
                    processedResponses.push({
                        tweet: {
                            id: response.tweet_id,
                            text: response.tweet_content,
                            author_id: response.author_id,
                            author_username: response.author_username,
                            created_at: response.tweet_created_at
                        },
                        decision: {
                            shouldEngage: true,
                            reason: "Previously decided to engage",
                            priority: 1
                        },
                        toneAnalysis: {
                            suggestedTone: response.tone,
                            dominantTone: response.tone,
                            reasoning: response.strategy
                        },
                        rejectionReason: approval.reason,
                        suggestedChanges: approval.suggestedChanges
                    });
                }
            }

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        fromAutoApproval: true,
                        batchToRespond: processedResponses
                    })
                })]
            };
        } catch (error) {
            logger.error('Error in auto approval node:', error);
            return { messages: [] };
        }
    }
}; 