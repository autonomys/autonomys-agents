import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { getKOLsAccounts, updateKOLs } from '../../utils/twitter.js';
import { SearchMode } from 'agent-twitter-client';
import { config } from '../../config/index.js';
import { ExtendedScraper } from '../../services/twitter/api.js';
const logger = createLogger('tweet-search-tool');

function getRandomAccounts(accounts: string[], n: number): string[] {
  const shuffled = [...accounts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, accounts.length));
}

export const createTweetSearchTool = (scraper: ExtendedScraper) =>
  new DynamicStructuredTool({
    name: 'search_recent_tweets',
    description: 'Search for recent tweets from specified accounts',
    schema: z.object({
      lastProcessedId: z.string().optional(),
    }),
    func: async ({ lastProcessedId }) => {
      try {
        logger.info('Called search_recent_tweets');
        await updateKOLs(scraper);
        const kols = await getKOLsAccounts();

        if (kols.length === 0) {
          logger.error('No valid accounts found after cleaning');
          return {
            tweets: [],
            lastProcessedId: null,
          };
        }

        const selectedKols = getRandomAccounts(kols, config.ACCOUNTS_PER_BATCH);

        const ACCOUNTS_PER_QUERY = 3;
        const tweetGroups = [];

        for (let i = 0; i < selectedKols.length; i += ACCOUNTS_PER_QUERY) {
          const accountsBatch = selectedKols.slice(i, i + ACCOUNTS_PER_QUERY);
          const query = `(${accountsBatch.map(account => `from:${account}`).join(' OR ')})`;

          const searchIterator = scraper.searchTweets(
            query,
            Math.floor(config.MAX_SEARCH_TWEETS / 4),
            SearchMode.Latest,
          );

          for await (const tweet of searchIterator) {
            if (lastProcessedId && tweet.id && tweet.id <= lastProcessedId) {
              break;
            }
            tweetGroups.push({
              id: tweet.id || '',
              text: tweet.text || '',
              author_id: tweet.userId || '',
              author_username: tweet.username?.toLowerCase() || '',
              created_at: tweet.timeParsed || new Date(),
            });
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const allTweets = tweetGroups.sort(
          (a, b) => b.created_at.getTime() - a.created_at.getTime(),
        );

        logger.info('Tweet search completed:', {
          foundTweets: allTweets.length,
          selectedKols,
        });

        return {
          tweets: allTweets,
          lastProcessedId: allTweets[allTweets.length - 1]?.id || null,
        };
      } catch (error) {
        logger.error('Error searching tweets:', error);
        return {
          tweets: [],
          lastProcessedId: null,
        };
      }
    },
  });
