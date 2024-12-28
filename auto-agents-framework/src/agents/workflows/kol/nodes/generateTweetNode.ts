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
      .pipe(config.llms.response)
      .pipe(trendTweetParser)
      .invoke({
        trendAnalysis: state.trendAnalysis,
      });

    if (globalConfig.twitterConfig.POST_TWEETS) {
      const tweet = await invokePostTweetTool(config.toolNode, generatedTweet.tweet);
      logger.info('Tweet posted successfully', { tweet });
    } else {
      logger.info('Tweet not posted', { tweet: generatedTweet.tweet });
    }
    return {
      messages: [new AIMessage({ content: JSON.stringify(generatedTweet) })],
      dsnData: generatedTweet,
    };
  };
