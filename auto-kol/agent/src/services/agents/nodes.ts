import { AIMessage } from "@langchain/core/messages";
import { State, logger, parseMessageContent, WorkflowConfig } from './workflow.js';
import * as prompts from './prompts.js';
import { ChromaService } from '../vectorstore/chroma.js';
import * as db from '../database/index.js';
import { flagBackSkippedTweet, getAllSkippedTweetsToRecheck, getLastDsnCid } from '../../database/index.js';
import { tweetSearchSchema } from '../../schemas/workflow.js';
import { uploadToDsn } from '../../utils/dsn.js';
export const createNodes = async (config: WorkflowConfig) => {


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

        // Log the tool response
        logger.info('Tool response received:', {
            messageCount: toolResponse.messages.length,
            lastMessageContent: toolResponse.messages[toolResponse.messages.length - 1].content
        });

            // Parse the string content into an object first
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
                for (const tweet of validatedResult.tweets) {
                    await chromaService.addTweet(tweet);
                }
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


    const engagementNode = async (state: typeof State.State) => {
        logger.info('Engagement Node - Evaluating tweet engagement');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);

            if (!parsedContent.tweets ||
                parsedContent.currentTweetIndex >= parsedContent.tweets.length) {
                logger.info('No more tweets to process');
                return { messages: [] };
            }

            const tweet = parsedContent.tweets[parsedContent.currentTweetIndex];

            if (state.processedTweets.has(tweet.id)) {
                logger.info(`Tweet ${tweet.id} already processed, moving to next`);
                return {
                    messages: [new AIMessage({
                        content: JSON.stringify({
                            tweets: parsedContent.tweets,
                            currentTweetIndex: parsedContent.currentTweetIndex + 1,
                            lastProcessedId: parsedContent.lastProcessedId
                        })
                    })]
                };
            }
            try {
                const decision = await prompts.engagementPrompt
                    .pipe(config.llms.decision)
                    .pipe(prompts.engagementParser)
                    .invoke({ tweet: tweet.text });

                logger.info('LLM decision:', { decision });

                if (!decision.shouldEngage) {
                    logger.info('Queueing skipped tweet to review queue:', { tweetId: tweet.id });
                    const tweetData = {
                        id: tweet.id,
                        text: tweet.text,
                        author_id: tweet.author_id,
                        author_username: tweet.author_username || 'unknown', // Ensure we have a fallback
                        created_at: typeof tweet.created_at === 'string' ? tweet.created_at : tweet.created_at.toISOString()
                    };

                    const toolResult = await config.toolNode.invoke({
                        messages: [new AIMessage({
                            content: '',
                            tool_calls: [{
                                name: 'queue_skipped',
                                args: {
                                    tweet: tweetData,
                                    reason: decision.reason,
                                    priority: decision.priority || 0,
                                    workflowState: { decision }
                                },
                                id: 'skip_call',
                                type: 'tool_call'
                            }]
                        })]
                    });

                    logger.info('Queue skipped result:', toolResult);
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
                    return {
                        messages: [new AIMessage({
                            content: JSON.stringify({
                                tweets: parsedContent.tweets,
                                currentTweetIndex: parsedContent.currentTweetIndex + 1,
                                lastProcessedId: parsedContent.lastProcessedId
                            })
                        })],
                        processedTweets: new Set([tweet.id])
                    };
                }

                return {
                    messages: [new AIMessage({
                        content: JSON.stringify({
                            tweets: parsedContent.tweets,
                            currentTweetIndex: parsedContent.currentTweetIndex,
                            tweet,
                            decision
                        })
                    })]
                };
        } catch (error) {
            logger.error('Error parsing LLM response:', error);
            // Default to not engaging if parsing fails
            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets: parsedContent.tweets,
                        currentTweetIndex: parsedContent.currentTweetIndex + 1,
                        lastProcessedId: parsedContent.lastProcessedId,
                        decision: {
                            shouldEngage: false,
                            reason: "Failed to parse LLM response",
                            priority: 1,
                            confidence: 0
                        }
                    })
                })],
                processedTweets: new Set([tweet.id])
            };
        }
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
            const { tweet, tweets, currentTweetIndex, decision } = parsedContent;

            const toneAnalysis = await prompts.tonePrompt
                .pipe(config.llms.tone)
                .pipe(prompts.toneParser)
                .invoke({ tweet: tweet.text });

            logger.info('Tone analysis:', { toneAnalysis });

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets,
                        currentTweetIndex,
                        tweet,
                        toneAnalysis,
                        decision
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
            const { tweet, toneAnalysis, tweets, currentTweetIndex, decision } = parsedContent;

            // Search for similar tweets by this author
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

            // Parse similar tweets response
            const similarTweets = parseMessageContent(
                similarTweetsResponse.messages[similarTweetsResponse.messages.length - 1].content
            );

            // Include similar tweets in the response prompt context
            const responseStrategy = await prompts.responsePrompt
                .pipe(config.llms.response)
                .pipe(prompts.responseParser)
                .invoke({
                    tweet: tweet.text,
                    tone: toneAnalysis.suggestedTone,
                    author: tweet.author_username,
                    similarTweets: JSON.stringify(similarTweets.similar_tweets)
                });

            logger.info('Response strategy:', { responseStrategy });
            
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
                    }
                }, 
                previousCid: await getLastDsnCid()
            });

            // Queue the response
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
                                responseStrategy
                            }
                        },
                        id: 'queue_response_call',
                        type: 'tool_call'
                    }]
                })]
            });

            // Move to next tweet and add current to processed set
            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets,
                        currentTweetIndex: currentTweetIndex + 1,
                        lastProcessedId: tweet.id,
                        responseStrategy
                    })
                })],
                processedTweets: new Set([tweet.id])
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
            // Get all skipped tweets marked for rechecking
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

            // Process each tweet through engagement decision
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

            // Return the first tweet that passed recheck
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