import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { TwitterApi } from '../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';

const logger = createLogger('fetch-mentions-tool');

export const createFetchMentionsTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_mentions',
    description: 'Fetch recent mentions',
    schema: z.object({ numberMentions: z.number().optional() }),
    func: async ({ numberMentions = 10 }: { numberMentions?: number }) => {
      try {
        const recentMentions = await twitterApi.getMyUnrepliedToMentions(numberMentions);

        return {
          tweets: recentMentions,
        };
      } catch (error) {
        logger.error('Error in fetchTimelineTool:', error);
        return {
          tweets: [],
        };
      }
    },
  });

export const invokeFetchMentionsTool = async (toolNode: ToolNode) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'fetch_mentions',
            args: {},
            id: 'fetch_mentions_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
