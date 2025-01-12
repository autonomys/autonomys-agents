import { WorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { engagementParser } from '../prompts.js';
import { Tweet } from '../../../../services/twitter/types.js';

const logger = createLogger('engagement-node');

const getEngagementDecision = async (tweet: Tweet, config: WorkflowConfig) => {
  const thread =
    tweet.thread && tweet.thread.length > 0
      ? tweet.thread.map(t => ({ text: t.text, username: t.username }))
      : 'No thread';

  const formattedPrompt = await config.prompts.engagementPrompt.format({
    tweet: JSON.stringify({ text: tweet.text, username: tweet.username }),
    thread: thread,
  });

  return await config.llms.decision.pipe(engagementParser).invoke(formattedPrompt);
};

export const createEngagementNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
    logger.info('Engagement Node - Starting evaluation');
    try {
      const { mentionsTweets, timelineTweets, processedTweetIds, repliedToTweetIds } = state;
      const allTweets = [...mentionsTweets, ...timelineTweets];
      const processedIds = [
        ...Array.from(processedTweetIds.values()),
        ...Array.from(repliedToTweetIds.values()),
      ];
      const tweets = allTweets.filter(tweet => !processedIds.includes(tweet.id!));
      logger.info('Tweets to evaluate', {
        allTweets: allTweets.length,
        processedTweets: processedIds.length,
        tweets: tweets.length,
      });
      const engagementDecisions = await Promise.all(
        tweets.map(async tweet => {
          const decision = await getEngagementDecision(tweet, config);
          logger.info('Engagement Decision', {
            tweet: tweet.text,
            thread: tweet.thread && tweet.thread.length > 0 ? tweet.thread[0].text : 'No thread',
            decision,
          });
          return {
            tweet: {
              id: tweet.id!,
              text: tweet.text!,
              username: tweet.username!,
              timeParsed: tweet.timeParsed!,
              thread:
                tweet.thread && tweet.thread.length > 0
                  ? Array.from(
                      tweet.thread.map(t => ({
                        id: t.id,
                        text: t.text,
                        username: t.username,
                        timeParsed: t.timeParsed,
                      })),
                    )
                  : 'No thread',
            },
            decision,
          };
        }),
      );
      return {
        processedTweetIds: processedIds,
        engagementDecisions,
      };
    } catch (error) {
      logger.error('Error in engagement node:', error);
      return { messages: [] };
    }
  };
};
