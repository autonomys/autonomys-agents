import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { TwitterApi } from '../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { config } from '../../config/index.js';
import { id } from 'ethers';

const logger = createLogger('post-tweet-tool');

export const createPostTweetTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'post_tweet',
    description: 'Post a tweet',
    schema: z.object({ tweet: z.string(), inReplyTo: z.string().optional() }),
    func: async ({ tweet, inReplyTo }: { tweet: string; inReplyTo?: string }) => {
      try {
        if (config.twitterConfig.POST_TWEETS) {
          const postedTweet = await twitterApi.sendTweet(tweet, inReplyTo);
          //TODO: After sending the tweet, we need to get the latest tweet, ensure it is the same as we sent and return it
          //This has not been working as expected, so we need to investigate this later
          // logger.info('Tweet posted successfully', {
          //   postedTweet: { id: postedTweet?.id, text: postedTweet?.text },
          // });
          return {
            postedTweet: true,
          };
        } else {
          logger.info('Tweet not posted', { tweet });
          return {
            postedTweet: false,
          };
        }
      } catch (error) {
        logger.error('Error posting tweet:', error);
        return {
          postedTweet: false,
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
