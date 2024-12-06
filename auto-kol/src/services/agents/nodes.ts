import { AIMessage } from "@langchain/core/messages";
import { State, logger, parseMessageContent, WorkflowConfig } from './workflow.js';
import * as prompts from './prompts.js';
import { ChromaService } from '../vectorstore/chroma.js';
import * as db from '../database/index.js';
import { tweetSearchSchema } from '../../schemas/workflow.js';

// Node factory functions
export const createNodes = async (config: WorkflowConfig) => {

    // Placeholder for now, because the timeline tool doesn't work
    const timelineNode = async (state: typeof State.State) => {
        logger.info('Timeline Node - Fetching recent tweets');
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

        // Parsing the ALL the tweets
        const parsedTweets = tweetSearchSchema.parse(toolResponse.messages[toolResponse.messages.length - 1].content);

        // TODO: Check if the tweets are new | doesn't exist in sqlite db

        const chromaService = await ChromaService.getInstance();
        for (const tweet of parsedTweets.tweets) {
            await chromaService.addTweet(tweet);
        }

        logger.info(`Added ${parsedTweets.tweets.length} tweets to the vector db`);


        return {
            messages: [new AIMessage({
                content: JSON.stringify(parsedTweets)
            })],
            lastProcessedId: parsedTweets.lastProcessedId || undefined
        };
    }

    const searchNode = async (state: typeof State.State) => {
        logger.info('Search Node - Fetching recent tweets');
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

            // The tool response will be in the last message's content
            const lastMessage = toolResponse.messages[toolResponse.messages.length - 1];

            // Handle different types of content
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

            const newTweets = [];
            for (const tweet of searchResult.tweets) {
                if (await db.isTweetExists(tweet.id)) {
                    continue;
                }
                newTweets.push(tweet);
            }
            // Validate the search result
            const validatedResult = tweetSearchSchema.parse({
                tweets: newTweets,
                lastProcessedId: searchResult.lastProcessedId
            });



            if (validatedResult.tweets.length > 0) {
                const chromaService = await ChromaService.getInstance();
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

            const decision = await prompts.engagementPrompt
                .pipe(config.llms.decision)
                .pipe(prompts.engagementParser)
                .invoke({ tweet: tweet.text });

            logger.info('LLM decision:', { decision });

            if (!decision.shouldEngage) {
                logger.info('Queueing skipped tweet to review queue:', { tweetId: tweet.id });

                // Ensure tweet object matches schema
                const tweetData = {
                    id: tweet.id,
                    text: tweet.text,
                    authorId: tweet.authorId,
                    authorUsername: tweet.authorUsername || 'unknown', // Ensure we have a fallback
                    createdAt: typeof tweet.createdAt === 'string' ? tweet.createdAt : tweet.createdAt.toISOString()
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
            logger.error('Error in engagement node:', error);
            return { messages: [] };
        }
    };

    const toneAnalysisNode = async (state: typeof State.State) => {
        logger.info('Tone Analysis Node - Analyzing tweet tone');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const { tweet, tweets, currentTweetIndex } = parsedContent;

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
                        toneAnalysis
                    })
                })]
            };
        } catch (error) {
            logger.error('Error in tone analysis node:', error);
            return { messages: [] };
        }
    };

    const responseGenerationNode = async (state: typeof State.State) => {
        logger.info('Response Generation Node - Creating response strategy');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const { tweet, toneAnalysis, tweets, currentTweetIndex } = parsedContent;

            // Search for similar tweets by this author
            const similarTweetsResponse = await config.toolNode.invoke({
                messages: [new AIMessage({
                    content: '',
                    tool_calls: [{
                        name: 'search_similar_tweets',
                        args: {
                            query: `author:${tweet.authorUsername} ${tweet.text}`,
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
                    author: tweet.authorUsername,
                    similarTweets: JSON.stringify(similarTweets.similar_tweets)
                });

            logger.info('Response strategy:', { responseStrategy });

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

    return {
        timelineNode,
        searchNode,
        engagementNode,
        toneAnalysisNode,
        responseGenerationNode
    };
};
