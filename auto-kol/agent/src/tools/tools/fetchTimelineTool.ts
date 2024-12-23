import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { tweetSearchSchema, tweetSchema } from '../../schemas/workflow.js';
import { Tweet } from '../../services/twitter/types.js';
import type { TwitterService } from '../../services/twitter/twitterService.js';

const logger = createLogger('fetch-timeline-tool');

const inputSchema = z.object({});
type TweetSearchResults = z.infer<typeof tweetSearchSchema>;
type TweetResult = z.infer<typeof tweetSchema>;

const convertTweetToTweetResult = (tweet: Tweet): TweetResult => {
  if (!tweet.id || !tweet.text || !tweet.userId || !tweet.username || !tweet.timeParsed) {
    throw new Error('Required tweet fields missing');
  }

  return {
    id: tweet.id,
    text: tweet.text,
    userId: tweet.userId,
    username: tweet.username,
    timeParsed: tweet.timeParsed,
  };
};

export const createFetchTimelineTool = (twitterService: TwitterService) =>
  new DynamicStructuredTool({
    name: 'fetch_timeline',
    description: 'Fetch the timeline regularly to get new tweets',
    schema: inputSchema,
    func: async (input: z.infer<typeof inputSchema>): Promise<TweetSearchResults> => {
      try {
        const tweets = await getTimeLine();
        tweets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return {
          tweets: validTweets,
          lastProcessedId: tweets[tweets.length - 1]?.id || null,
        };
      } catch (error) {
        logger.error('Error in fetchTimelineTool:', error);
        return {
          tweets: [],
          lastProcessedId: null,
        };
      }
    },
  });
