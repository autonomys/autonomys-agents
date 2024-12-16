
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { config } from '../../config/index.js';
import { getKOLsAccounts, updateKOLs } from '../../utils/twitter.js';

const logger = createLogger('tweet-search-tool');

export const createTweetSearchTool = (scraper: any) => new DynamicStructuredTool({
    name: 'search_recent_tweets',
    description: 'Search for recent tweets from specified accounts',
    schema: z.object({
        lastProcessedId: z.string().optional()
    }),
    func: async ({ lastProcessedId }) => {
        try {
            logger.info('Called search_recent_tweets');
            await updateKOLs();
            const cleanAccounts = await getKOLsAccounts()
            logger.info('Fetching KOLs:', await getKOLsAccounts());
            if (cleanAccounts.length === 0) {
                logger.error('No valid accounts found after cleaning');
                return {
                    tweets: [],
                    lastProcessedId: null
                };
            }

            logger.info('Starting tweet search with:', {
                cleanAccounts,
                lastProcessedId
            });
            const allTweets = [];

            for (const account of cleanAccounts) {
                const tweetIterator = scraper.getTweets(account, 2);
                for await (const tweet of tweetIterator) {
                    if (lastProcessedId && tweet.id && tweet.id <= lastProcessedId) {
                        break;
                    }
                    allTweets.push({
                        id: tweet.id || '',
                        text: tweet.text || '',
                        author_id: tweet.userId || '',
                        author_username: tweet.username?.toLowerCase() || '',
                        created_at: tweet.timeParsed || new Date()
                    });
                }
            }

            allTweets.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

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