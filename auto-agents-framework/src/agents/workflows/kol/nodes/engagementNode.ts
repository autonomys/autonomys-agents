import { AIMessage } from '@langchain/core/messages';
import { WorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { parseMessageContent } from '../../utils.js';
import { engagementParser, engagementPrompt } from '../prompts.js';
import { Tweet } from '../../../../services/twitter/types.js';

const logger = createLogger('engagement-node');

const getEngagementDecision = async (tweet: Tweet, config: WorkflowConfig) => {
  const decision = await engagementPrompt
    .pipe(config.llms.decision)
    .pipe(engagementParser)
    .invoke({
      tweet: tweet.text,
      thread: tweet.thread || [],
    });
  return decision;
};

export const createEngagementNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
    logger.info('Engagement Node - Starting evaluation');
    try {
      const { mentionsTweets, timelineTweets } = state;
      const tweets = [...mentionsTweets, ...timelineTweets];
      const engagementDecisions = await Promise.all(
        tweets.map(async tweet => {
          const decision = await getEngagementDecision(tweet, config);
          logger.info('Engagement Decision', {
            tweet: tweet.text,
            thread: tweet.thread ? tweet.thread[0].text : 'No thread',
            decision,
          });
          return { tweet, decision };
        }),
      );
      return {
        messages: [
          new AIMessage({
            content: JSON.stringify({
              tweets: [],
            }),
          }),
        ],
        engagementDecisions: engagementDecisions,
      };
    } catch (error) {
      logger.error('Error in engagement node:', error);
      return { messages: [] };
    }
  };
};
