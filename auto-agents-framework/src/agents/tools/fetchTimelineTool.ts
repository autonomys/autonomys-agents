import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { TwitterApi } from '../../services/twitter/types.js';
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
      numRandomFollowers: z.number(),
    }),
    func: async ({
      processedIds,
      numTimelineTweets,
      numFollowingRecentTweets,
      numRandomFollowers,
    }: {
      processedIds: string[];
      numTimelineTweets: number;
      numFollowingRecentTweets: number;
      numRandomFollowers: number;
    }) => {
      try {
        const myTimelineTweets = await twitterApi.getMyTimeline(numTimelineTweets, processedIds);
        const followingRecents = await twitterApi.getFollowingRecentTweets(
          numFollowingRecentTweets,
          numRandomFollowers,
        );
        const tweets = new Set([...myTimelineTweets, ...followingRecents]);
        const sortedTweets = Array.from(tweets).sort(
          (a, b) => new Date(b.timeParsed!).getTime() - new Date(a.timeParsed!).getTime(),
        );
        logger.info('Timeline tweets:', { tweets: sortedTweets.length });
        return {
          tweets: sortedTweets,
        };
      } catch (error) {
        logger.error('Error in fetchTimelineTool:', error);
        return {
          tweets: [],
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
    numRandomFollowers,
  }: {
    processedIds: string[];
    numTimelineTweets: number;
    numFollowingRecentTweets: number;
    numRandomFollowers: number;
  },
) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'fetch_timeline',
            args: { processedIds, numTimelineTweets, numFollowingRecentTweets, numRandomFollowers },
            id: 'fetch_timeline_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
