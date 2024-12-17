import { AIMessage } from "@langchain/core/messages";
import { State, logger, parseMessageContent } from '../workflow.js';
import * as prompts from '../prompts.js';
import { uploadToDsn } from '../../../utils/dsn.js';
import { getLastDsnCid } from '../../../database/index.js';
import { WorkflowConfig } from '../workflow.js';
import { config as globalConfig } from '../../../config/index.js';

export const createResponseGenerationNode = (config: WorkflowConfig, scraper: any) => {
    return async (state: typeof State.State) => {
        logger.info('Response Generation Node - Creating response strategy');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const batchToRespond = parsedContent.batchToRespond || [];

            logger.info(`Processing batch of ${batchToRespond.length} tweets for response generation`);

            await Promise.all(
                batchToRespond.map(async ({ tweet, decision, toneAnalysis }: { tweet: any; decision: any; toneAnalysis: any }) => {

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
                            mentions: JSON.stringify(threadMentionsTweets)
                        });

                    logger.info('Response strategy:', { responseStrategy });

                    if (globalConfig.DSN_UPLOAD) {
                        await uploadToDsn({
                            data: {
                                type: 'response',
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
                                    }
                                },
                                mentions: threadMentionsTweets
                            },
                            previousCid: await getLastDsnCid()
                        });
                    }

                    await config.toolNode.invoke({
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
                                        similarTweets: similarTweets.similar_tweets
                                    }
                                },
                                id: 'queue_response_call',
                                type: 'tool_call'
                            }]
                        })]
                    });

                })
            );

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets: parsedContent.tweets,
                        currentTweetIndex: parsedContent.currentTweetIndex,
                        pendingEngagements: parsedContent.pendingEngagements,
                        lastProcessedId: parsedContent.lastProcessedId
                    })
                })],
                processedTweets: new Set(batchToRespond.map((item: any) => item.tweet.id))
            };
        } catch (error) {
            logger.error('Error in response generation node:', error);
            return { messages: [] };
        }
    }
}