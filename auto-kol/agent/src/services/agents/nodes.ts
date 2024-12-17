import { AIMessage } from "@langchain/core/messages";
import { State, logger, parseMessageContent, WorkflowConfig } from './workflow.js';
import * as prompts from './prompts.js';
import { ChromaService } from '../vectorstore/chroma.js';
import * as db from '../database/index.js';
import { flagBackSkippedTweet, getAllSkippedTweetsToRecheck, getLastDsnCid } from '../../database/index.js';
import { tweetSearchSchema } from '../../schemas/workflow.js';
import { uploadToDsn } from '../../utils/dsn.js';
import { createTwitterClientScraper } from '../twitter/api.js';
import { config as globalConfig } from '../../config/index.js';

export const createNodes = async (config: WorkflowConfig) => {

    const scraper = await createTwitterClientScraper();

    ///////////MENTIONS///////////
    const mentionNode = async (state: typeof State.State) => {
        logger.info('Mention Node - Fetching recent mentions');
        const toolResponse = await config.toolNode.invoke({
            messages: [
                new AIMessage({
                    content: '',
                    tool_calls: [{
                        name: 'fetch_mentions',
                        args: {},
                        id: 'fetch_mentions_call',
                        type: 'tool_call'
                    }]
                })
            ]
        });

        const parsedContent = parseMessageContent(toolResponse.messages[toolResponse.messages.length - 1].content);
        const parsedTweets = tweetSearchSchema.parse(parsedContent);
        logger.info('Parsed tweets:', parsedTweets);
        logger.info(`Found ${parsedTweets.tweets.length} tweets`);

        return {
            messages: [new AIMessage({
                content: JSON.stringify(parsedTweets)
            })],
            lastProcessedId: parsedTweets.lastProcessedId || undefined
        };
    }

    ///////////TIMELINE///////////
    const timelineNode = async (state: typeof State.State) => {
        logger.info('Timeline Node - Fetching recent tweets');
        const existingTweets = state.messages.length > 0 ?
            parseMessageContent(state.messages[state.messages.length - 1].content).tweets : [];

        logger.info(`Existing tweets: ${existingTweets.length}`);
        const toolResponse = await config.toolNode.invoke({
            messages: [
                new AIMessage({
                    content: '',
                    tool_calls: [{
                        name: 'fetch_timeline',
                        args: {},
                        id: 'fetch_timeline_call',
                        type: 'tool_call'
                    }]
                })
            ]
        });

        logger.info('Tool response received:', {
            messageCount: toolResponse.messages.length,
            lastMessageContent: toolResponse.messages[toolResponse.messages.length - 1].content
        });

        const content = toolResponse.messages[toolResponse.messages.length - 1].content;
        const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

        const parsedTweets = tweetSearchSchema.parse(parsedContent);

        const newTweets = [...existingTweets];
        for (const tweet of parsedTweets.tweets) {
            if (await db.isTweetExists(tweet.id)) {
                continue;
            }
            newTweets.push(tweet);
        }

        return {
            messages: [new AIMessage({
                content: JSON.stringify({
                    tweets: newTweets,
                })
            })],
            lastProcessedId: parsedTweets.lastProcessedId || undefined
        };
    }

    ///////////SEARCH///////////
    const searchNode = async (state: typeof State.State) => {
        logger.info('Search Node - Fetching recent tweets');
        const existingTweets = state.messages.length > 0 ?
            parseMessageContent(state.messages[state.messages.length - 1].content).tweets : [];

        logger.info(`Existing tweets: ${existingTweets.length}`);
        try {
            logger.info('Last processed id:', state.lastProcessedId);

            const toolResponse = await config.toolNode.invoke({
                messages: [
                    new AIMessage({
                        content: '',
                        tool_calls: [{
                            name: 'search_recent_tweets',
                            args: {
                                lastProcessedId: state.lastProcessedId || undefined
                            },
                            id: 'tool_call_id',
                            type: 'tool_call'
                        }],
                    }),
                ],
            });

            const lastMessage = toolResponse.messages[toolResponse.messages.length - 1];

            let searchResult;
            if (typeof lastMessage.content === 'string') {
                try {
                    searchResult = JSON.parse(lastMessage.content);
                    logger.info('Parsed search result:', searchResult);
                } catch (error) {
                    logger.error('Failed to parse search result:', error);
                    searchResult = { tweets: [], lastProcessedId: null };
                }
            } else {
                searchResult = lastMessage.content;
                logger.info('Non-string search result:', searchResult);
            }

            const newTweets = [...existingTweets];
            for (const tweet of searchResult.tweets) {
                if (await db.isTweetExists(tweet.id)) {
                    continue;
                }
                newTweets.push(tweet);
            }
            const validatedResult = tweetSearchSchema.parse({
                tweets: newTweets,
                lastProcessedId: searchResult.lastProcessedId
            });


            const chromaService = await ChromaService.getInstance();

            if (validatedResult.tweets.length > 0) {
                await Promise.all(
                    validatedResult.tweets.map(tweet => chromaService.addTweet(tweet))
                );
            }

            logger.info(`Found ${validatedResult.tweets.length} tweets`);

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets: validatedResult.tweets,
                        currentTweetIndex: 0,
                        lastProcessedId: validatedResult.lastProcessedId
                    })
                })],
                lastProcessedId: validatedResult.lastProcessedId || undefined
            };
        } catch (error) {
            logger.error('Error in search node:', error);
            const emptyResult = {
                tweets: [],
                lastProcessedId: null
            };
            return {
                messages: [new AIMessage({ content: JSON.stringify(emptyResult) })],
                lastProcessedId: undefined
            };
        }
    };

    ///////////ENGAGEMENT///////////
    // Helper function to handle skipped tweets
    const handleSkippedTweet = async (tweet: any, decision: any, config: any) => {
        logger.info('Skipping engagement for tweet', { tweetId: tweet.id, reason: decision.reason });
        await config.toolNode.invoke({
            messages: [new AIMessage({
                content: '',
                tool_calls: [{
                    name: 'queue_skipped',
                    args: {
                        tweet,
                        reason: decision.reason,
                        priority: decision.priority || 0,
                        workflowState: { decision }
                    },
                    id: 'skip_call',
                    type: 'tool_call'
                }]
            })]
        });

        if (globalConfig.DSN_UPLOAD) {
            await uploadToDsn({
                data: {
                    type: 'skipped',
                    tweet,
                    decision,
                    workflowState: {
                        decision,
                        toneAnalysis: null,
                        responseStrategy: null
                    }
                },
                previousCid: await getLastDsnCid()
            });
        }
    };

    const engagementNode = async (state: typeof State.State) => {
        logger.info('Engagement Node - Starting evaluation');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const pendingEngagements = parsedContent.pendingEngagements || [];            
            
            if (pendingEngagements.length > 0) {
                logger.info(`number of pending engagements: ${pendingEngagements.length}`);

                return {
                    messages: [new AIMessage({
                        content: JSON.stringify({
                            tweets: parsedContent.tweets,
                            currentTweetIndex: parsedContent.currentTweetIndex,
                            batchToAnalyze: pendingEngagements,
                            pendingEngagements: [],
                            lastProcessedId: parsedContent.lastProcessedId
                        })
                    })],
                    processedTweets: state.processedTweets
                };
            }

            const BATCH_SIZE = 15;
            const startIdx = parsedContent.currentTweetIndex || 0;
            const endIdx = Math.min(startIdx + BATCH_SIZE, parsedContent.tweets.length);
            const batchTweets = parsedContent.tweets.slice(startIdx, endIdx);

            logger.info('Processing batch of tweets', {
                batchSize: batchTweets.length,
                startIndex: startIdx,
                endIndex: endIdx,
                totalTweets: parsedContent.tweets.length
            });

            const processedResults = await Promise.all(batchTweets.map(async (tweet: any) => {
                if (state.processedTweets.has(tweet.id)) {
                    return { tweet, status: 'alreadyProcessed' };
                }

                const decision = await prompts.engagementPrompt
                    .pipe(config.llms.decision)
                    .pipe(prompts.engagementParser)
                    .invoke({ tweet: tweet.text });

                return { tweet, decision, status: 'processing' };
            }));

            const tweetsToEngage = [];
            const newProcessedTweets = new Set<string>(state.processedTweets);

            for (const result of processedResults) {
                newProcessedTweets.add(result.tweet.id);
                if (result.status === 'processing' && result.decision?.shouldEngage) {
                    tweetsToEngage.push({
                        tweet: result.tweet,
                        decision: result.decision
                    });
                } else if (result.status === 'processing') {
                    await handleSkippedTweet(result.tweet, result.decision, config);
                }
            }

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets: parsedContent.tweets,
                        currentTweetIndex: tweetsToEngage.length > 0 ? startIdx : endIdx,
                        pendingEngagements: tweetsToEngage,
                        lastProcessedId: parsedContent.lastProcessedId
                    })
                })],
                processedTweets: newProcessedTweets
            };
        } catch (error) {
            logger.error('Error in engagement node:', error);
            return { messages: [] };
        }
    };

    ///////////TONE ANALYSIS///////////
    const toneAnalysisNode = async (state: typeof State.State) => {
        logger.info('Tone Analysis Node - Analyzing tweet tone');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const batchToAnalyze = parsedContent.batchToAnalyze || [];

            logger.info(`Processing batch of ${batchToAnalyze.length} tweets for tone analysis`);

            const analyzedBatch = await Promise.all(
                batchToAnalyze.map(async ({ tweet, decision }: { tweet: any; decision: any }) => {
                    const toneAnalysis = await prompts.tonePrompt
                        .pipe(config.llms.tone)
                        .pipe(prompts.toneParser)
                        .invoke({ tweet: tweet.text });

                    logger.info('Tone analysis:', { toneAnalysis });

                    return {
                        tweet,
                        decision,
                        toneAnalysis
                    };
                })
            );

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets: parsedContent.tweets,
                        currentTweetIndex: parsedContent.currentTweetIndex,
                        batchToRespond: analyzedBatch,
                        pendingEngagements: parsedContent.pendingEngagements,
                        lastProcessedId: parsedContent.lastProcessedId
                    })
                })]
            };
        } catch (error) {
            logger.error('Error in tone analysis node:', error);
            return { messages: [] };
        }
    };

    ///////////RESPONSE GENERATION///////////
    const responseGenerationNode = async (state: typeof State.State) => {
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
    };

    ///////////RECHECK SKIPPED///////////
    const recheckSkippedNode = async (state: typeof State.State) => {
        logger.info('Recheck Skipped Node - Reviewing previously skipped tweets');
        try {
            const skippedTweets = await getAllSkippedTweetsToRecheck();

            if (!skippedTweets || skippedTweets.length === 0) {
                logger.info('No skipped tweets to recheck');
                return {
                    messages: [new AIMessage({
                        content: JSON.stringify({
                            fromRecheckNode: true,
                            messages: []
                        })
                    })]
                };
            }

            logger.info(`Found ${skippedTweets.length} skipped tweets to recheck`);

            const processedTweets = [];
            for (const tweet of skippedTweets) {
                const decision = await prompts.engagementPrompt
                    .pipe(config.llms.decision)
                    .pipe(prompts.engagementParser)
                    .invoke({ tweet: tweet.text });

                logger.info('Recheck decision:', { tweetId: tweet.id, decision });

                if (decision.shouldEngage) {
                    processedTweets.push({
                        tweet,
                        decision
                    });
                } else {
                    const flagged = await flagBackSkippedTweet(tweet.id, decision.reason);
                    if (!flagged) {
                        logger.info('Failed to flag back skipped tweet:', { tweetId: tweet.id });
                    }
                }
            }

            if (processedTweets.length === 0) {
                logger.info('No skipped tweets passed recheck');
                return { messages: [] };
            }

            const { tweet, decision } = processedTweets[0];

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets: [tweet],
                        currentTweetIndex: 0,
                        tweet,
                        decision
                    })
                })]
            };
        } catch (error) {
            logger.error('Error in recheck skipped node:', error);
            return { messages: [] };
        }
    };

    return {
        mentionNode,
        timelineNode,
        searchNode,
        engagementNode,
        toneAnalysisNode,
        responseGenerationNode,
        recheckSkippedNode
    };
};