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
    logger.info('Collect Data Node - Collecting fresh data');
    const { processedTweetIds, repliedToTweetIds } = state;

    const processedIds = [
      ...Array.from(processedTweetIds.values()),
      ...Array.from(repliedToTweetIds.values()),
    ];
    logger.info('Processed IDs:', { processedIds: processedIds.length });

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

    const myRepliedToIds = JSON.parse(myRecentTweetsContent).repliedToTweetIds
      ? JSON.parse(myRecentTweetsContent).repliedToTweetIds
      : [];

    logger.info('Tool response received:', {
      timelineMessageCount: timelineTweets.length,
      mentionsMessageCount: mentionsTweets.length,
      myRecentTweetsCount: myRecentTweets.length,
      repliedToTweetIds: myRepliedToIds.length,
    });

    return {
      timelineTweets: new Set(timelineTweets),
      mentionsTweets: new Set(mentionsTweets),
      myRecentTweets: new Set(myRecentTweets),
      repliedToTweetIds: new Set(myRepliedToIds),
    };
  };
