import { TwitterWorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../twitterWorkflow.js';
import { summaryParser } from '../prompts.js';

const logger = createLogger('summary-node');

export const createSummaryNode =
  (config: TwitterWorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Summary Node - Summarizing previous replies');
    const myRecentReplies = Array.from(state.myRecentReplies.values()).map(reply => reply.text);

    const summary = await config.prompts.summaryPrompt
      .pipe(config.llms.analyze)
      .pipe(summaryParser)
      .invoke({
        tweets: JSON.stringify(myRecentReplies),
      });
    logger.info('Summary:', summary);
    return {
      summary,
    };
  };
