import { AIMessage } from "@langchain/core/messages";
import { State, logger, parseMessageContent } from '../workflow.js';
import * as prompts from '../prompts.js';
import { WorkflowConfig } from '../workflow.js';
import { getLastDsnCid, getPendingResponses, updateResponseStatus } from '../../../database/index.js';
import { uploadToDsn } from "../../../utils/dsn.js";
import { config as globalConfig } from '../../../config/index.js';
import { ResponseStatus } from '../../../types/queue.js';

export const createAutoApprovalNode = (config: WorkflowConfig) => {
    return async (state: typeof State.State) => {
        logger.info('Auto Approval Node - Evaluating pending responses');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const { batchToFeedback } = parsedContent;
           
            if (!batchToFeedback.length) {
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

            for (const response of batchToFeedback) {
                logger.info('Processing response', {
                    response
                });
              
                const approval = await prompts.autoApprovalPrompt
                    .pipe(config.llms.decision)
                    .pipe(prompts.autoApprovalParser)
                    .invoke({
                        tweet: response.tweet,
                        response: response.response,
                        tone: response.toneAnalysis?.dominantTone,
                        strategy: response.responseStrategy?.strategy
                    });
                
                if (approval.approved) {
                    // POST THE TWEET
                    response.type = ResponseStatus.APPROVED;
                    // get response id by tweet id
                    // const responseId = await getResponseIdByTweetId(response.tweet_id);
                    // await updateResponseStatus(response.id, ResponseStatus.APPROVED);
                    // update the response status in the database


                    if (globalConfig.DSN_UPLOAD) {
                        await uploadToDsn({
                            data: response,
                            previousCid: await getLastDsnCid()
                        });
                    }
                } else if (response.retry > globalConfig.RETRY_LIMIT) {
                    response.type = ResponseStatus.REJECTED;
                    logger.info('Rejecting tweet', {
                        data: response.tweet.id
                    });
                    await updateResponseStatus(response.id, ResponseStatus.REJECTED);
                    if (globalConfig.DSN_UPLOAD) {
                        await uploadToDsn({
                            data: response,
                            previousCid: await getLastDsnCid()
                        });
                    }
                } else {
                    processedResponses.push({
                        ...response,
                        type: ResponseStatus.PENDING,
                        workflowState: {
                            ...response.workflowState,
                            autoFeedback: [...response.workflowState.autoFeedback, {
                                response: response.response,
                                reason: approval.reason,
                                suggestedChanges: approval.suggestedChanges
                            }]
                        },
                        feedbackDecision: 'reject'
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