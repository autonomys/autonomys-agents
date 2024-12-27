import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { TwitterAPI } from '../../services/twitter/client.js';

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
