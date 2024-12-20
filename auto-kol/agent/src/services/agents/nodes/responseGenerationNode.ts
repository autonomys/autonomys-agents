import { AIMessage } from "@langchain/core/messages";
import { State, logger, parseMessageContent } from '../workflow.js';
import * as prompts from '../prompts.js';
import { uploadToDsn } from '../../../utils/dsn.js';
import { getLastDsnCid } from '../../../database/index.js';
import { WorkflowConfig } from '../workflow.js';
import { config as globalConfig } from '../../../config/index.js';
import { ResponseStatus } from '../../../types/queue.js';

export const createResponseGenerationNode = (config: WorkflowConfig, scraper: any) => {
    return async (state: typeof State.State) => {
        logger.info('Response Generation Node - Creating response strategy');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const batchToRespond = parsedContent.batchToRespond || [];
            const batchToFeedback: any[] = [];

            logger.info(`Processing batch of ${batchToRespond.length} tweets for response generation`, {
                hasRejectedResponses: parsedContent.fromAutoApproval
            });

            await Promise.all(
                batchToRespond.map(async (item: any) => {
                    const { tweet, decision, toneAnalysis, workflowState } = item;
                    
                    if (!workflowState) {
                        item.workflowState = { autoFeedback: [] };
                    } else if (!workflowState.autoFeedback) {
                        workflowState.autoFeedback = [];
                    }

                    if (workflowState?.feedbackDecision?.toLowerCase === 'reject') {
                        item.retry = (item.retry || 0) + 1;
                        logger.info('Regenerating response due to rejection:', {
                            retry: item.retry
                        });
                        
                    } else {
                        item.retry = 0;
                    }

                    const lastFeedback = workflowState?.autoFeedback[workflowState?.autoFeedback.length - 1];
                    const rejectionInstructions = lastFeedback 
                        ? prompts.formatRejectionInstructions(lastFeedback.reason) 
                        : '';
                    const rejectionFeedback = lastFeedback
                        ? prompts.formatRejectionFeedback(lastFeedback.reason, lastFeedback.suggestedChanges)
                        : '';

                    const threadMentionsTweets = [];
                    if (tweet.mention) {
                        const mentions = await scraper.getThread(tweet.id);
                        for await (const mention of mentions) {
                            threadMentionsTweets.push({
                                id: mention.id,
                                text: mention.text,
                                author_id: mention.userId,
                                author_username: mention.username?.toLowerCase() || 'unknown',
                                created_at: mention.timeParsed?.toISOString() || new Date().toISOString()
                            });
                        }
                    }

                    const similarTweetsResponse = await config.toolNode.invoke({
                        messages: [new AIMessage({
                            content: '',
                            tool_calls: [{
                                name: 'search_similar_tweets',
                                args: {
                                    query: `author:${tweet.author_username} ${tweet.text}`,
                                    k: 5
                                },
                                id: 'similar_tweets_call',
                                type: 'tool_call'
                            }],
                        })],
                    });

                    const similarTweets = parseMessageContent(
                        similarTweetsResponse.messages[similarTweetsResponse.messages.length - 1].content
                    );

                    const responseStrategy = await prompts.responsePrompt
                        .pipe(config.llms.response)
                        .pipe(prompts.responseParser)
                        .invoke({
                            tweet: tweet.text,
                            tone: toneAnalysis.suggestedTone,
                            author: tweet.author_username,
                            similarTweets: JSON.stringify(similarTweets.similar_tweets),
                            mentions: JSON.stringify(threadMentionsTweets),
                            previousResponse: workflowState?.autoFeedback[workflowState?.autoFeedback.length - 1]?.response || '',
                            rejectionFeedback,
                            rejectionInstructions
                        });

                
                    const data = {
                        type: ResponseStatus.PENDING,
                        tweet,
                        response: responseStrategy.content,
                        workflowState: {
                            decision,
                            toneAnalysis,
                            responseStrategy: {
                                tone: responseStrategy.tone,
                                strategy: responseStrategy.strategy,
                                referencedTweets: responseStrategy.referencedTweets,
                                confidence: responseStrategy.confidence
                                },
                                autoFeedback: workflowState?.autoFeedback
                        },
                        mentions: threadMentionsTweets,
                        retry: item.retry
                    }
                    batchToFeedback.push(data);

                    // dsnData[tweet.id] = data;
                    // if (globalConfig.DSN_UPLOAD) {
                    //     await uploadToDsn({
                    //         data,
                    //         previousCid: await getLastDsnCid()
                    //     });
                    // }
                    
                    const queueResponse = await config.toolNode.invoke({
                    messages: [new AIMessage({
                        content: '',
                        tool_calls: [{
                            name: 'queue_response',
                            args: {
                                tweet,
                                response: responseStrategy.content,
                                workflowState: {
                                    toneAnalysis,
                                    responseStrategy,
                                    mentions: threadMentionsTweets,
                                    similarTweets: similarTweets.similar_tweets,
                                    autoFeedback: workflowState?.autoFeedback
                                }
                            },
                            id: 'queue_response_call',
                            type: 'tool_call'
                        }]
                        })]
                    });
                    return queueResponse;
                    
                })
            );

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets: parsedContent.tweets,
                        currentTweetIndex: parsedContent.currentTweetIndex,
                        pendingEngagements: parsedContent.pendingEngagements,
                        lastProcessedId: parsedContent.lastProcessedId,
                        batchToFeedback: batchToFeedback,
                    })
                })],
                processedTweets: new Set(batchToRespond.map((item: any) => item.tweet.id))
            };
        } catch (error) {
            logger.error('Error in response generation node:', error);
            return { messages: [] };
        }
    }
};