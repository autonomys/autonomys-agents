import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { TwitterAPI } from '../../services/twitter/client.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';

const logger = createLogger('fetch-timeline-tool');

export const createFetchTimelineTool = (twitterAPI: TwitterAPI) =>
  new DynamicStructuredTool({
    name: 'fetch_timeline',
    description: 'Fetch the timeline regularly to get new tweets',
    schema: z.object({}),
    func: async () => {
      try {
        const tweets = await twitterAPI.getMyTimeline(10, []);
        tweets.sort(
          (a, b) => new Date(b.timeParsed!).getTime() - new Date(a.timeParsed!).getTime(),
        );
        return {
          tweets: tweets,
        };
      } catch (error) {
        logger.error('Error in fetchTimelineTool:', error);
        return {
          tweets: [],
          lastProcessedId: null,
        };
      }
    },
  });

export const invokeFetchTimelineTool = async (toolNode: ToolNode) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'fetch_timeline',
            args: {},
            id: 'fetch_timeline_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
