import { DynamicStructuredTool } from '@langchain/core/tools';
import { TwitterApiReadWrite } from 'twitter-api-v2';
import { searchTweets } from '../services/twitter/api';
import { addToQueue, addToSkipped } from '../services/queue';
import { queueActionSchema } from '../schemas/workflow';
import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { z } from 'zod';

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
                if (!Array.isArray(config.TARGET_ACCOUNTS) || config.TARGET_ACCOUNTS.length === 0) {
                    logger.error('No target accounts configured');
                    return {
                        tweets: [],
                        lastProcessedId: null
                    };
                }

                // Clean up account names - remove spaces and @ symbols
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
                    lastProcessedId: lastProcessedId
                });

                const processedId = !lastProcessedId ? undefined : lastProcessedId;
                const tweets = await searchTweets(client, cleanAccounts, processedId);

                logger.info('Tweet search completed:', {
                    foundTweets: tweets.length,
                    accounts: cleanAccounts
                });

                const result = {
                    tweets: tweets.map(tweet => ({
                        id: tweet.id,
                        text: tweet.text,
                        authorId: tweet.authorId,
                        createdAt: tweet.createdAt
                    })),
                    lastProcessedId: tweets[tweets.length - 1]?.id || null
                };

                return result;
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
                        content: input.response,
                        sentiment: 'neutral' as const,
                        confidence: 1
                    },
                    status: 'pending' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    workflowState: input.workflowState
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
                    workflowState: input.workflowState
                };

                addToSkipped(skippedTweet);
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

    return {
        tweetSearchTool,
        queueResponseTool,
        queueSkippedTool,
        tools: [tweetSearchTool, queueResponseTool, queueSkippedTool]
    };
};