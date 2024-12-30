import { WorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { invokePostTweetTool } from '../../../tools/postTweetTool.js';
import { tweetPrompt, trendTweetParser } from '../prompts.js';
import { AIMessage } from '@langchain/core/messages';
import { config as globalConfig } from '../../../../config/index.js';

const logger = createLogger('generate-tweet-node');

export const createGenerateTweetNode =
  (config: WorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Generate Tweet Node - Generating tweet');

    if (!state.trendAnalysis || !state.trendAnalysis.trends.length) {
      logger.error('Missing trend analysis in state');
      return {
        messages: [new AIMessage({ content: JSON.stringify({ error: 'Missing trend analysis' }) })],
      };
    }

    const generatedTweet = await tweetPrompt
      .pipe(config.llms.generation)
      .pipe(trendTweetParser)
      .invoke({
        trendAnalysis: state.trendAnalysis,
        recentTweets: state.myRecentTweets,
      });

    const _tweet = await invokePostTweetTool(config.toolNode, generatedTweet.tweet);

    return {
      messages: [new AIMessage({ content: JSON.stringify(generatedTweet) })],
      dsnData: generatedTweet,
    };
  };
