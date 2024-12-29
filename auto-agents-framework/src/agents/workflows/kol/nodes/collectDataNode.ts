import { WorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { convertMessageContentToTweets } from '../../../tools/utils/twitter.js';
import { invokeFetchTimelineTool } from '../../../tools/fetchTimelineTool.js';
import { invokeFetchMentionsTool } from '../../../tools/fetchMentionsTool.js';
import { invokeFetchMyRecentTweetsTool } from '../../../tools/fetchMyRecentTweetsTool.js';

const logger = createLogger('collect-data-node');

export const createCollectDataNode =
  (config: WorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Collect Data Node - Collecting recent data');

    // TODO: get state to exist across workflow runs, so we can use it here
    const processedIds = Array.from(state.timelineTweets.values()).map(tweet => tweet.id!);
    logger.info('Processed IDs:', { ids: processedIds });
    const timelineToolResponse = await invokeFetchTimelineTool(config.toolNode, processedIds);

    const timelineContent =
      timelineToolResponse.messages[timelineToolResponse.messages.length - 1].content;
    const timelineTweets = convertMessageContentToTweets(timelineContent);

    const mentionsToolResponse = await invokeFetchMentionsTool(config.toolNode);
    const mentionsContent =
      mentionsToolResponse.messages[mentionsToolResponse.messages.length - 1].content;
    const mentionsTweets = convertMessageContentToTweets(mentionsContent);

    const myRecentTweetsToolResponse = await invokeFetchMyRecentTweetsTool(config.toolNode);
    const myRecentTweetsContent =
      myRecentTweetsToolResponse.messages[myRecentTweetsToolResponse.messages.length - 1].content;
    const myRecentTweets = convertMessageContentToTweets(myRecentTweetsContent);

    logger.info('Tool response received:', {
      timelineMessageCount: timelineTweets.length,
      mentionsMessageCount: mentionsTweets.length,
      myRecentTweetsMessageCount: myRecentTweets.length,
    });

    return {
      timelineTweets: new Set(timelineTweets),
      mentionsTweets: new Set(mentionsTweets),
      myRecentTweets: new Set(myRecentTweets),
    };
  };
