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
            const { dsnData } = parsedContent;
           
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
                    dsnData[response.tweet_id].type = ResponseStatus.APPROVED;
                    await updateResponseStatus(response.id, ResponseStatus.APPROVED);
                    if (globalConfig.DSN_UPLOAD) {
                        await uploadToDsn({
                            data: dsnData[response.tweet_id],
                            previousCid: await getLastDsnCid()
                        });
                    }
                } else if (dsnData[response.tweet_id]?.retry > 1) {
                    dsnData[response.tweet_id].type = ResponseStatus.REJECTED;
                    logger.info('Rejecting tweet', {
                        data: dsnData[response.tweet_id].tweet.id
                    });
                    await updateResponseStatus(response.id, ResponseStatus.REJECTED);
                    if (globalConfig.DSN_UPLOAD) {
                        await uploadToDsn({
                            data: dsnData[response.tweet_id],
                            previousCid: await getLastDsnCid()
                        });
                    }
                } else {
                    if (!dsnData[response.tweet_id]) {
                        dsnData[response.tweet_id] = { retry: 0 };
                    } else if (!dsnData[response.tweet_id].retry) {
                        dsnData[response.tweet_id].retry = 0;
                    }
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
                        suggestedChanges: approval.suggestedChanges,
                        retry: dsnData[response.tweet_id].retry
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