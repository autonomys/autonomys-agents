import { AIMessage } from '@langchain/core/messages';
import { State, logger, parseMessageContent } from '../workflow.js';
import * as prompts from '../prompts.js';
import { getAllTrends } from '../../../database/index.js';
import { WorkflowConfig } from '../workflow.js';
import { config as globalConfig } from '../../../config/index.js';
import { ResponseStatus } from '../../../types/queue.js';
import { uploadToDsn } from '../../../utils/dsn.js';

import {
  addTopLevelTweet,
  getLatestTopLevelTweets,
  wipeTrendsTable,
} from '../../../database/index.js';
import { v4 as generateId } from 'uuid';

export const createTopLevelTweetNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
    logger.info('Trend Post Node - Creating tweet from trends');
    try {
      const lastMessage = state.messages[state.messages.length - 1];
      const parsedContent = parseMessageContent(lastMessage.content);
      const { tweets, currentTweetIndex } = parsedContent;

      const trends = await getAllTrends();

      if (!trends || trends.length === 0) {
        logger.info('No trends found to create tweet from');
        return {
          messages: [
            new AIMessage({
              content: JSON.stringify({
                fromTopLevelTweetNode: true,
                currentTweetIndex: currentTweetIndex,
                tweets: tweets,
                pendingEngagements: [],
                messages: [],
              }),
            }),
          ],
        };
      }

      const recentTrends = trends
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, 5);

      const trendSummaries = recentTrends.map(t => t.content).join('\n\n');
      const latestTopLevelTweets = await getLatestTopLevelTweets();
      const latestTopLevelTweetsText =
        latestTopLevelTweets.map(r => r.content).join('\n') || 'This is the first tweet';

      const lastTweetTime = latestTopLevelTweets[0].created_at;

      const timeSinceLastTweetInHours =
        Math.abs(new Date().getTime() - (lastTweetTime.getTime() - 8 * 60 * 60 * 1000)) /
        (1000 * 60 * 60);

      const tweetGeneration = await prompts.topLevelTweetPrompt
        .pipe(config.llms.decision)
        .pipe(prompts.topLevelTweetParser)
        .invoke({
          trends: trendSummaries,
          latestTopLevelTweetsText,
        });

      logger.info('Generated trend tweet:', {
        tweet: tweetGeneration.tweet,
        reasoning: tweetGeneration.reasoning,
      });

      await addTopLevelTweet({
        id: generateId(),
        content: tweetGeneration?.tweet,
      });

      if (
        globalConfig.POST_TWEETS &&
        timeSinceLastTweetInHours > globalConfig.TOP_LEVEL_TWEET_INTERVAL_HOURS
      ) {
        logger.info('Sending tweet');
        await config.client.sendTweet(tweetGeneration.tweet).then(async res => {
          const latestTweet = await config.client.getLatestTweet(
            globalConfig.TWITTER_USERNAME || '',
          );
          const data = {
            type: ResponseStatus.POSTED,
            tweet: {
              id: latestTweet?.id,
              text: latestTweet?.text,
              author_id: latestTweet?.userId,
              author_username: latestTweet?.username,
              created_at: (latestTweet?.timeParsed as Date).toISOString(),
            },
          };
          if (globalConfig.DSN_UPLOAD) {
            await uploadToDsn({
              data,
            });
          }
        });
        await wipeTrendsTable();
      }

      return {
        messages: [
          new AIMessage({
            content: JSON.stringify({
              fromTopLevelTweetNode: true,
              currentTweetIndex: currentTweetIndex,
              tweets: tweets,
              pendingEngagements: [],
              messages: [],
            }),
          }),
        ],
      };
    } catch (error) {
      logger.error('Error in trend post node:', error);
      return { messages: [] };
    }
  };
};
