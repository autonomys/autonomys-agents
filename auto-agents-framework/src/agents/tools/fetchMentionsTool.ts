import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { TwitterAPI } from '../../services/twitter/client.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';

const logger = createLogger('fetch-mentions-tool');

export const createFetchMentionsTool = (twitterAPI: TwitterAPI) =>
  new DynamicStructuredTool({
    name: 'fetch_mentions',
    description: 'Fetch recent mentions',
    schema: z.object({}),
    func: async () => {
      try {
        const recentMentions = await twitterAPI.getMyUnrepliedToMentions(10);
        recentMentions.sort(
          (a, b) => new Date(b.timeParsed!).getTime() - new Date(a.timeParsed!).getTime(),
        );
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
