import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';

const logger = createLogger('fetch-my-recent-replies-tool');

export const createFetchMyRecentRepliesTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_my_recent_replies',
    description: 'Fetch my recent reply tweets',
    schema: z.object({
      maxRecentReplies: z.number(),
    }),
    func: async ({ maxRecentReplies }: { maxRecentReplies: number }) => {
      try {
        const recentReplies = await twitterApi.getMyRecentReplies(maxRecentReplies);
        logger.info('Recent replies fetched:', { count: recentReplies.length });

        return {
          tweets: recentReplies,
        };
      } catch (error) {
        logger.error('Error in fetchMyRecentRepliesTool:', error);
        return {
          tweets: [],
        };
      }
    },
  });

export const invokeFetchMyRecentRepliesTool = async (
  toolNode: ToolNode,
  { maxRecentReplies }: { maxRecentReplies: number },
) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'fetch_my_recent_replies',
            args: { maxRecentReplies },
            id: 'fetch_my_recent_replies_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
