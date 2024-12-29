import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { TwitterApi } from '../../services/twitter/client.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';

const logger = createLogger('post-tweet-tool');

const postTweet = async (twitterApi: TwitterApi, tweet: string, inReplyTo?: string) => {
  if(tweet.length > 280) {
    return twitterApi.scraper.sendLongTweet(tweet, inReplyTo);
  }
  return twitterApi.scraper.sendTweet(tweet, inReplyTo);
}
export const createPostTweetTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'post_tweet',
    description: 'Post a tweet',
    schema: z.object({ tweet: z.string(), inReplyTo: z.string().optional() }),
    func: async ({ tweet, inReplyTo }: { tweet: string; inReplyTo?: string }) => {
      try {
        logger.info('logged in', { loggedIn: await twitterApi.isLoggedIn(), tweet });
        const postedTweet = postTweet(twitterApi, tweet, inReplyTo).then(async res => {
          const latestTweet = await twitterApi.scraper.getLatestTweet(twitterApi.username);
          return latestTweet;
        });
        logger.info('Tweet posted successfully', { postedTweet });
        return {
          postedTweet,
        };
      } catch (error) {
        logger.error('Error posting tweet:', error);
        return {
          postedTweet: null,
        };
      }
    },
  });

export const invokePostTweetTool = async (
  toolNode: ToolNode,
  tweet: string,
  inReplyTo?: string,
) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'post_tweet',
            args: { tweet, inReplyTo },
            id: 'post_tweet_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
