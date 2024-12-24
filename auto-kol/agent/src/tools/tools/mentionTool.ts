import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { addMention, getLatestMentionId } from '../../database/index.js';
import { ExtendedScraper } from '../../services/twitter/api.js';
import { Tweet } from '../../types/twitter.js';
const logger = createLogger('mention-tool');

export const createMentionTool = (scraper: ExtendedScraper) =>
  new DynamicStructuredTool({
    name: 'fetch_mentions',
    description: 'Fetch mentions since the last processed mention',
    schema: z.object({}),
    func: async () => {
      try {
        const sinceId = await getLatestMentionId();
        const mentions = await scraper.getMyMentions(100, sinceId);
        if (!mentions || mentions.length === 0) {
          logger.info('No new mentions found');
          return {
            tweets: [],
            lastProcessedId: sinceId,
          };
        }

        const tweets = mentions.map((mention: any) => ({
          id: mention.id!,
          text: mention.text!,
          author_id: mention.userId!,
          author_username: mention.username!.toLowerCase(),
          created_at: mention.timeParsed!.toISOString(),
          thread: [] as Tweet[],
        }));

        await addMention({
          latest_id: mentions[0].id!,
        });

        logger.info(`Fetched ${tweets.length} new mentions`);
        for (const tweet of tweets) {
          logger.info(`Getting thread for tweet ${tweet.id}`);
          const tweetsWithThreads: Tweet[] = [];
          const thread = await scraper.getThread(tweet.id);
          for await (const threadTweet of thread) {
            tweetsWithThreads.push({
              id: threadTweet.id || '',
              text: threadTweet.text || '',
              author_id: threadTweet.userId || '',
              author_username: threadTweet.username?.toLowerCase() || 'unknown',
              created_at: threadTweet.timeParsed?.toISOString() || new Date().toISOString(),
            });
          }
          tweet.thread = tweetsWithThreads;
          await new Promise(resolve => setTimeout(resolve, 1000));
          logger.info(`Found ${tweetsWithThreads.length} tweets in thread`);
        }
        return {
          tweets: tweets,
          lastProcessedId: mentions[0].id!,
        };
      } catch (error) {
        logger.error('Error in mentionTool:', error);
        return {
          tweets: [],
          lastProcessedId: null,
        };
      }
    },
  });
