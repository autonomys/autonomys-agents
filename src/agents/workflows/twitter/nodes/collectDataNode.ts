import { TwitterWorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../twitterWorkflow.js';
import { convertMessageContentToTweets } from '../../../tools/twitter/utils/twitter.js';
import { invokeFetchTimelineTool } from '../../../tools/twitter/fetchTimelineTool.js';
import { invokeFetchMentionsTool } from '../../../tools/twitter/fetchMentionsTool.js';
import { invokeFetchMyRecentTweetsTool } from '../../../tools/twitter/fetchMyRecentTweetsTool.js';
import { invokeFetchMyRecentRepliesTool } from '../../../tools/twitter/fetchMyRecentRepliesTool.js';
import { config as globalConfig } from '../../../../config/index.js';

const { twitterConfig } = globalConfig;

const logger = createLogger('collect-data-node');

export const createCollectDataNode =
  (config: TwitterWorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Collect Data Node - Collecting fresh data');
    const { processedTweetIds } = state;

    const processedIds = [...Array.from(processedTweetIds.values())];
    logger.info('Processed IDs:', { processedIds: processedIds.length });

    //////////MY RECENT REPLIES//////////
    const myRecentRepliesToolResponse = await invokeFetchMyRecentRepliesTool(config.toolNode, {
      maxRecentReplies: twitterConfig.MAX_MY_RECENT_REPLIES,
    });
    const myRecentRepliesContent =
      myRecentRepliesToolResponse.messages[myRecentRepliesToolResponse.messages.length - 1].content;
    const myRecentReplies = convertMessageContentToTweets(myRecentRepliesContent);

    //////////TIMELINE & TREND//////////
    const timelineToolResponse = await invokeFetchTimelineTool(config.toolNode, {
      processedIds,
      numTimelineTweets: twitterConfig.NUM_TIMELINE_TWEETS,
      numFollowingRecentTweets: twitterConfig.NUM_FOLLOWING_RECENT_TWEETS,
      numRandomFollowings: twitterConfig.NUM_RANDOM_FOLLOWINGS,
    });
    const timelineContent = JSON.parse(
      timelineToolResponse.messages[timelineToolResponse.messages.length - 1].content,
    );
    const timelineTweetsConverted = convertMessageContentToTweets(
      JSON.stringify({ tweets: timelineContent.tweets.timelineTweets }),
    );
    const followingRecentsConverted = convertMessageContentToTweets(
      JSON.stringify({ tweets: timelineContent.tweets.followingRecents }),
    );
    const trendAnalysisTweets = [...timelineTweetsConverted, ...followingRecentsConverted];
    const timelineTweets = [
      ...Array.from(timelineTweetsConverted)
        .sort(() => Math.random() - 0.5)
        .slice(0, twitterConfig.NUM_TIMELINE_TWEETS),
      ...followingRecentsConverted,
    ];

    //////////MENTIONS//////////
    const mentionsToolResponse = await invokeFetchMentionsTool(config.toolNode, {
      maxMentions: twitterConfig.MAX_MENTIONS,
    });
    const mentionsContent =
      mentionsToolResponse.messages[mentionsToolResponse.messages.length - 1].content;
    const mentionsTweets = convertMessageContentToTweets(mentionsContent);

    //////////MY RECENT TWEETS//////////
    const myRecentTweetsToolResponse = await invokeFetchMyRecentTweetsTool(config.toolNode, {
      maxMyRecentTweets: twitterConfig.MAX_MY_RECENT_TWEETS,
    });
    const myRecentTweetsContent =
      myRecentTweetsToolResponse.messages[myRecentTweetsToolResponse.messages.length - 1].content;
    const myRecentTweets = convertMessageContentToTweets(myRecentTweetsContent);

    //////////REPLIED TO TWEET IDS//////////
    const myRepliedToIds = JSON.parse(myRecentTweetsContent).repliedToTweetIds
      ? JSON.parse(myRecentTweetsContent).repliedToTweetIds
      : [];

    logger.info('Tool response received:', {
      myRecentRepliesCount: myRecentReplies.length,
      timelineMessageCount: timelineTweets.length,
      trendAnalysisMessageCount: trendAnalysisTweets.length,
      mentionsMessageCount: mentionsTweets.length,
      myRecentTweetsCount: myRecentTweets.length,
      repliedToTweetIds: myRepliedToIds.length,
    });

    return {
      timelineTweets: new Set(timelineTweets),
      trendAnalysisTweets: new Set(trendAnalysisTweets),
      mentionsTweets: new Set(mentionsTweets),
      myRecentTweets: new Set(myRecentTweets),
      myRecentReplies: new Set(myRecentReplies),
      repliedToTweetIds: new Set(myRepliedToIds),
    };
  };
