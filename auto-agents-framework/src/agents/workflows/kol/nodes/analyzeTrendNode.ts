import { AIMessage } from '@langchain/core/messages';
import { WorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { trendParser, trendPrompt } from '../prompts.js';

const logger = createLogger('analyze-timeline-trend-node');

export const createAnalyzeTrendNode =
  (config: WorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Analyze Trend Node - Analyzing trends');

    const tweets = Array.from(state.timelineTweets.values())
      .map(tweet => `author: ${tweet.username} text: ${tweet.text}`)
      .join('\n\n');
    logger.info('Tweets:', { tweets });

    const trendAnalysis = await trendPrompt.pipe(config.llms.decision).pipe(trendParser).invoke({
      tweets: tweets,
    });

    logger.info('Trend analysis:', trendAnalysis);

    return {
      messages: [
        new AIMessage({
          content: JSON.stringify({
            trend: trendAnalysis,
          }),
        }),
      ],
      trendAnalysis,
    };
  };
