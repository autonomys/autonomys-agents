import { AIMessage } from "@langchain/core/messages";
import { State, logger, parseMessageContent, WorkflowConfig } from './workflow.js';
import * as prompts from './prompts.js';
import { ChromaService } from '../vectorstore/chroma.js';
import * as db from '../database/index.js';
import { flagBackSkippedTweet, getAllSkippedTweetsToRecheck } from '../../database/index.js';
import { tweetSearchSchema } from '../../schemas/workflow.js';
import { createWebSearchTool } from '../../tools/tools/webSearchTool.js';

export const createNodes = async (config: WorkflowConfig) => {

    ///////////TIMELINE///////////
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

        logger.info('Timeline Node - Processing response');
        const content = toolResponse.messages[toolResponse.messages.length - 1].content;
        const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
        const parsedTweets = tweetSearchSchema.parse(parsedContent);

        logger.info('Timeline Node - Returning result', {
            tweetCount: parsedTweets.tweets?.length,
            lastProcessedId: parsedTweets.lastProcessedId
        });

        return {
            messages: [new AIMessage({
                content: JSON.stringify({
                    ...parsedTweets,
                    currentTweetIndex: 0,
                    nodeType: 'timeline_result'
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

            const newTweets = [...existingTweets];
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
                        lastProcessedId: validatedResult.lastProcessedId,
                        nodeType: 'search_result'
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
                !Array.isArray(parsedContent.tweets) ||
                parsedContent.tweets.length === 0 ||
                typeof parsedContent.currentTweetIndex !== 'number' ||
                parsedContent.currentTweetIndex >= parsedContent.tweets.length) {

                logger.error('Invalid state in engagement node:', {
                    hasTweets: !!parsedContent.tweets,
                    tweetsLength: parsedContent.tweets?.length,
                    currentIndex: parsedContent.currentTweetIndex
                });

                return {
                    messages: [new AIMessage({
                        content: JSON.stringify({
                            tweets: [],
                            currentTweetIndex: 0,
                            nodeType: 'engagement_error'
                        })
                    })]
                };
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
                            decision,
                            nodeType: 'engagement_result'
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
                            },
                            nodeType: 'response_generation_error'
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
            const { tweet, tweets, currentTweetIndex } = parsedContent;

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
                        similarTweets: similarTweets.similar_tweets,
                        nodeType: 'tone_analysis_result'
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
            const { tweet, toneAnalysis, tweets, currentTweetIndex, webResearch = "No web research available.", similarTweets } = parseMessageContent(lastMessage.content);

            const responseStrategy = await prompts.responsePrompt
                .pipe(config.llms.response)
                .pipe(prompts.responseParser)
                .invoke({
                    tweet: tweet.text,
                    tone: toneAnalysis.suggestedTone,
                    author: tweet.author_username,
                    similarTweets: JSON.stringify(similarTweets),
                    webResearch
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
                        responseStrategy,
                        nodeType: 'response_generation_result'
                    })
                })],
                processedTweets: new Set([tweet.id])
            };
        } catch (error) {
            logger.error('Error in response generation node:', error, {
                state: JSON.stringify(state.messages.map(m => ({
                    contentKeys: Object.keys(parseMessageContent(m.content))
                })))
            });
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

    const webResearchNode = async (state: typeof State.State) => {
        logger.info('Web Research Node - Starting research evaluation');
        const lastMessage = state.messages[state.messages.length - 1];
        const content = parseMessageContent(lastMessage.content);
        const currentTweet = content.tweets[content.currentTweetIndex];

        logger.info('Evaluating research need for tweet:', {
            tweetId: currentTweet.id,
            text: currentTweet.text
        });

        const researchDecision = await config.llms.decision.invoke(
            await prompts.webResearchPrompt.format({
                tweet: currentTweet.text
            })
        );

        // Clean and parse the response
        const rawContent = researchDecision.content;
        const cleanedContent = typeof rawContent === 'string'
            ? rawContent.replace(/```json\n|\n```/g, '').trim()
            : rawContent;
        const parsedDecision = parseMessageContent(cleanedContent);

        logger.info('Research decision:', { parsedDecision });
        let webResearchResults = "No additional research needed.";

        if (parsedDecision.should_research && parsedDecision.research_query) {
            logger.info('Performing web research with query:', parsedDecision.research_query);
            try {
                const webSearchTool = createWebSearchTool();
                const searchResults = await webSearchTool.call({
                    query: parsedDecision.research_query
                });

                if (searchResults.results.length > 0) {
                    webResearchResults = searchResults.results
                        .slice(0, 3)
                        .map((result: any) => `${result.title}: ${result.snippet}`)
                        .join('\n');
                    logger.info('Web research completed successfully');
                }
            } catch (error) {
                logger.error('Error performing web research', { error });
            }
        }

        logger.info('Web research node completed');
        return {
            messages: [new AIMessage({
                content: JSON.stringify({
                    ...content,
                    webResearch: webResearchResults,
                    researchDecision: parsedDecision,
                    nodeType: 'web_research_result'
                })
            })]
        };
    };

    return {
        timelineNode,
        searchNode,
        engagementNode,
        toneAnalysisNode,
        responseGenerationNode,
        recheckSkippedNode,
        webResearchNode
    };
};
