import { WorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { convertMessageContentToTweets } from '../../../tools/convertTweetMessages.js';
import { invokeFetchTimelineTool } from '../../../tools/fetchTimelineTool.js';

const logger = createLogger('collect-data-node');

export const createCollectDataNode =
  (config: WorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Collect Data Node - Collecting recent data');

    const processedIds = Array.from(state.timelineTweets.values()).map(tweet => tweet.id!);
    logger.info('Processed IDs:', { ids: processedIds });
    const timelineToolResponse = await invokeFetchTimelineTool(config.toolNode, processedIds);

    const timelineContent =
      timelineToolResponse.messages[timelineToolResponse.messages.length - 1].content;
    const timelineTweets = convertMessageContentToTweets(timelineContent);

    logger.info('Tool response received:', {
      messageCount: timelineTweets.length,
    });

    return {
      timelineTweets: new Set(timelineTweets),
    };
  };
