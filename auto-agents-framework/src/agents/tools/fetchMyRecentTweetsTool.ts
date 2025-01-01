import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { TwitterApi } from '../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';

const logger = createLogger('fetch-recent-tweets-tool');

export const createFetchMyRecentTweetsTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_my_recent_tweets',
    description: 'Fetch the agents recent tweets',
    schema: z.object({}),
    func: async () => {
      try {
        const myRecentTweets = await twitterApi.getMyRecentTweets(10);
        const repliedToTweetIds = await twitterApi.getMyRepliedToIds();
        logger.info('Fetch My Recent Tweets Tool - Result', {
          tweets: myRecentTweets.length,
          repliedToTweetIds: repliedToTweetIds.length,
        });

        return {
          tweets: myRecentTweets,
          repliedToTweetIds: repliedToTweetIds,
        };
      } catch (error) {
        logger.error('Error in fetchRecentTweetsTool:', error);
        return {
          tweets: [],
          repliedToTweetIds: [],
        };
      }
    },
  });

export const invokeFetchMyRecentTweetsTool = async (toolNode: ToolNode) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'fetch_my_recent_tweets',
            args: {},
            id: 'fetch_my_recent_tweets_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};