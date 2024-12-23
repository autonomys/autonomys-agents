import { AIMessage } from "@langchain/core/messages";
import { State, logger, parseMessageContent } from '../workflow.js';
import * as prompts from '../prompts.js';
import { WorkflowConfig } from '../workflow.js';
import { getLastDsnCid, updateResponseStatusByTweetId } from '../../../database/index.js';
import { uploadToDsn } from "../../../utils/dsn.js";
import { config as globalConfig } from '../../../config/index.js';
import { ResponseStatus } from '../../../types/queue.js';
import { ExtendedScraper } from '../../../services/twitter/api.js';

export const createAutoApprovalNode = (config: WorkflowConfig, scraper: ExtendedScraper) => {
    return async (state: typeof State.State) => {
        logger.info('Auto Approval Node - Evaluating pending responses');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const { tweets, currentTweetIndex, batchToFeedback } = parsedContent;

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
                    tweetId: response.tweet.id,
                    retry: response.retry
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
                    response.type = ResponseStatus.APPROVED;

                    await updateResponseStatusByTweetId(response.tweet.id, ResponseStatus.APPROVED);

                    if (globalConfig.POST_TWEETS) {
                        logger.info('Sending tweet', {
                            response: response.response,
                            tweetId: response.tweet.id
                        });

                        const sendTweetResponse = await scraper.sendTweet(response.response, response.tweet.id);
                        logger.info('Tweet sent', {
                            sendTweetResponse
                        });
                    }

                    if (globalConfig.DSN_UPLOAD) {
                        await uploadToDsn({
                            data: response,
                            previousCid: await getLastDsnCid()
                        });
                    }
                } else if (response.retry > globalConfig.RETRY_LIMIT) {
                    response.type = ResponseStatus.REJECTED;
                    logger.info('Rejecting tweet', {
                        tweetId: response.tweet.id,
                    });
                    await updateResponseStatusByTweetId(response.tweet.id, ResponseStatus.REJECTED);
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
                        tweets: tweets,
                        currentTweetIndex: currentTweetIndex,
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