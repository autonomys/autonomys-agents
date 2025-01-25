import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';

const logger = createLogger('fetch-timeline-tool');

export const createFetchTimelineTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_timeline',
    description: 'Fetch the agents timeline to get recent tweets',
    schema: z.object({
      processedIds: z.array(z.string()),
      numTimelineTweets: z.number(),
      numFollowingRecentTweets: z.number(),
      numRandomFollowings: z.number(),
    }),
    func: async ({
      processedIds,
      numTimelineTweets,
      numFollowingRecentTweets,
      numRandomFollowings,
    }: {
      processedIds: string[];
      numTimelineTweets: number;
      numFollowingRecentTweets: number;
      numRandomFollowings: number;
    }) => {
      try {
        const myTimelineTweets = await twitterApi.getMyTimeline(numTimelineTweets, processedIds);
        const followingRecents = await twitterApi.getFollowingRecentTweets(
          numFollowingRecentTweets,
          numRandomFollowings,
        );
        const tweets = {
          timelineTweets:
            // the twitter api does not respect the count parameter
            myTimelineTweets.length > numTimelineTweets
              ? myTimelineTweets.sort((_a, _b) => Math.random() - 0.5).slice(0, numTimelineTweets)
              : myTimelineTweets,
          followingRecents: followingRecents,
        };
        logger.info('Timeline tweets:', {
          timelineTweets: tweets.timelineTweets.length,
          followingRecents: tweets.followingRecents.length,
        });
        return { tweets };
      } catch (error) {
        logger.error('Error in fetchTimelineTool:', error);
        return {
          tweets: {
            timelineTweets: [],
            followingRecents: [],
          },
        };
      }
    },
  });

export const invokeFetchTimelineTool = async (
  toolNode: ToolNode,
  {
    processedIds,
    numTimelineTweets,
    numFollowingRecentTweets,
    numRandomFollowings,
  }: {
    processedIds: string[];
    numTimelineTweets: number;
    numFollowingRecentTweets: number;
    numRandomFollowings: number;
  },
) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'fetch_timeline',
            args: {
              processedIds,
              numTimelineTweets,
              numFollowingRecentTweets,
              numRandomFollowings,
            },
            id: 'fetch_timeline_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
