import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { TwitterApi } from '../../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { cleanTweetForCircularReferences } from './utils/twitter.js';

const logger = createLogger('fetch-mentions-tool');

export const createFetchMentionsTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_mentions',
    description: 'Fetch recent mentions',
    schema: z.object({ maxMentions: z.number(), sinceId: z.string().optional() }),
    func: async ({ maxMentions, sinceId }: { maxMentions: number; sinceId?: string }) => {
      try {
        const recentMentions = await twitterApi.getMyUnrepliedToMentions(maxMentions, sinceId);
        return {
          tweets: recentMentions.map(cleanTweetForCircularReferences),
        };
      } catch (error) {
        logger.error('Error in fetchMentionsTool:', error);
        return {
          tweets: [],
        };
      }
    },
  });

export const invokeFetchMentionsTool = async (
  toolNode: ToolNode,
  { maxMentions, sinceId }: { maxMentions: number; sinceId?: string },
) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'fetch_mentions',
            args: { maxMentions, sinceId },
            id: 'fetch_mentions_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
