import { TwitterWorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../twitterWorkflow.js';
import { trendParser } from '../prompts.js';

const logger = createLogger('analyze-timeline-trend-node');

export const createAnalyzeTrendNode =
  (config: TwitterWorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Analyze Trend Node - Analyzing trends');

    const tweets = Array.from(state.trendAnalysisTweets.values()).map(({ username, text }) => ({
      username,
      text,
    }));
    logger.info('Tweets for trend analysis:', { tweets: tweets.length });

    const trendAnalysis = await config.prompts.trendPrompt
      .pipe(config.llms.analyze)
      .pipe(trendParser)
      .invoke({
        tweets: JSON.stringify(tweets),
      });

    logger.info('Trend analysis:', trendAnalysis);

    return {
      trendAnalysis,
    };
  };
