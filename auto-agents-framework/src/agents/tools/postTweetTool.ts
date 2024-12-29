import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { TwitterApi } from '../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';

const logger = createLogger('post-tweet-tool');

export const createPostTweetTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'post_tweet',
    description: 'Post a tweet',
    schema: z.object({ tweet: z.string(), inReplyTo: z.string().optional() }),
    func: async ({ tweet, inReplyTo }: { tweet: string; inReplyTo?: string }) => {
      try {
        const postedTweet = await twitterApi.sendTweet(tweet, inReplyTo);
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
