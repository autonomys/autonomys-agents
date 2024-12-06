import { DynamicStructuredTool } from '@langchain/core/tools';
import { TwitterApiReadWrite } from 'twitter-api-v2';
import { searchTweets } from '../services/twitter/api.js';
import { addToQueue, addToSkipped } from '../services/queue/index.js';
import { queueActionSchema } from '../schemas/workflow.js';
import { createLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { z } from 'zod';
import { WorkflowState } from '../types/workflow.js';
import { ChromaService } from '../services/vectorstore/chroma.js';
import { twitterClientScraper } from '../services/twitter/apiv2.js';

const logger = createLogger('workflow-tools');

export const createTools = (client: TwitterApiReadWrite) => {
    const tweetSearchTool = new DynamicStructuredTool({
        name: 'search_recent_tweets',
        description: 'Search for recent tweets from specified accounts',
        schema: z.object({
            lastProcessedId: z.string().optional()
        }),
        func: async ({ lastProcessedId }) => {
            try {
                logger.info('Called search_recent_tweets');
                if (!Array.isArray(config.TARGET_ACCOUNTS) || config.TARGET_ACCOUNTS.length === 0) {
                    logger.error('No target accounts configured');
                    return {
                        tweets: [],
                        lastProcessedId: null
                    };
                }

                const cleanAccounts = config.TARGET_ACCOUNTS
                    .filter(account => account && account.trim().length > 0)
                    .map(account => account.trim().replace('@', ''));

                if (cleanAccounts.length === 0) {
                    logger.error('No valid accounts found after cleaning');
                    return {
                        tweets: [],
                        lastProcessedId: null
                    };
                }

                logger.info('Starting tweet search with:', {
                    rawAccounts: config.TARGET_ACCOUNTS,
                    cleanAccounts,
                    lastProcessedId
                });

                const scraper = await twitterClientScraper();
                const allTweets = [];

                for (const account of cleanAccounts) {
                    const tweetIterator = scraper.getTweets(account, 1);
                    for await (const tweet of tweetIterator) {
                        if (lastProcessedId && tweet.id && tweet.id <= lastProcessedId) {
                            break;
                        }
                        allTweets.push({
                            id: tweet.id || '',
                            text: tweet.text || '',
                            authorId: tweet.userId || '',
                            authorUsername: tweet.username || '',
                            createdAt: tweet.timeParsed || new Date()
                        });
                    }
                }

                allTweets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

                logger.info('Tweet search completed:', {
                    foundTweets: allTweets.length,
                    accounts: cleanAccounts
                });

                return {
                    tweets: allTweets,
                    lastProcessedId: allTweets[allTweets.length - 1]?.id || null
                };
            } catch (error) {
                logger.error('Error searching tweets:', error);
                return {
                    tweets: [],
                    lastProcessedId: null
                };
            }
        }
    });

    const queueResponseTool = new DynamicStructuredTool({
        name: 'queue_response',
        description: 'Add a response to the approval queue',
        schema: queueActionSchema,
        func: async (input) => {
            try {
                const id = uuidv4();
                const queuedResponse = {
                    id,
                    tweet: input.tweet,
                    response: {
                        content: input.workflowState?.responseStrategy?.content,
                    },
                    status: 'pending' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    workflowState: input.workflowState as WorkflowState
                };

                addToQueue(queuedResponse);
                return {
                    success: true,
                    id,
                    type: 'response' as const,
                    message: 'Response queued successfully'
                };
            } catch (error) {
                logger.error('Error queueing response:', error);
                throw error;
            }
        }
    });

    const queueSkippedTool = new DynamicStructuredTool({
        name: 'queue_skipped',
        description: 'Add a skipped tweet to the review queue',
        schema: queueActionSchema,
        func: async (input) => {
            try {
                const id = uuidv4();
                const skippedTweet = {
                    id,
                    tweet: input.tweet,
                    reason: input.reason || 'No reason provided',
                    priority: input.priority || 0,
                    createdAt: new Date(),
                    workflowState: input.workflowState as WorkflowState
                };

                logger.info('Queueing skipped tweet:', {
                    id,
                    tweetId: input.tweet.id,
                    reason: input.reason,
                    priority: input.priority
                });

                addToSkipped(skippedTweet);

                logger.info('Successfully queued skipped tweet:', { id });

                return {
                    success: true,
                    id,
                    type: 'skipped' as const,
                    message: 'Tweet queued for review'
                };
            } catch (error) {
                logger.error('Error queueing skipped tweet:', error);
                throw error;
            }
        }
    });

    const searchSimilarTweetsTool = new DynamicStructuredTool({
        name: 'search_similar_tweets',
        description: 'Search for similar tweets in the vector store',
        schema: z.object({
            query: z.string(),
            k: z.number().optional().default(5)
        }),
        func: async ({ query, k }) => {
            try {
                const chromaService = await ChromaService.getInstance();
                const results = await chromaService.searchSimilarTweetsWithScore(query, k);
                logger.info('Similar tweets search results:', results);
                return {
                    similar_tweets: results.map(([doc, score]) => ({
                        text: doc.pageContent,
                        metadata: doc.metadata,
                        similarity_score: score
                    }))
                };
            } catch (error) {
                logger.error('Error searching similar tweets:', error);
                return { similar_tweets: [] };
            }
        }
    });

    return {
        tweetSearchTool,
        queueResponseTool,
        queueSkippedTool,
        searchSimilarTweetsTool,
        tools: [tweetSearchTool, queueResponseTool, queueSkippedTool, searchSimilarTweetsTool]
    };
};