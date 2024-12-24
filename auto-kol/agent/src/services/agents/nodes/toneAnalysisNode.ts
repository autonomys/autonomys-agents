import { AIMessage } from '@langchain/core/messages';
import { State, logger, parseMessageContent } from '../workflow.js';
import * as prompts from '../prompts.js';
import { WorkflowConfig } from '../workflow.js';

export const createToneAnalysisNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
    logger.info('Tone Analysis Node - Analyzing tweet tone');
    try {
      const lastMessage = state.messages[state.messages.length - 1];
      const parsedContent = parseMessageContent(lastMessage.content);
      const batchToAnalyze = parsedContent.batchToAnalyze || [];

      logger.info(`Processing batch of ${batchToAnalyze.length} tweets for tone analysis`);

      const analyzedBatch = await Promise.all(
        batchToAnalyze.map(async ({ tweet, decision }: { tweet: any; decision: any }) => {
          const toneAnalysis = await prompts.tonePrompt
            .pipe(config.llms.tone)
            .pipe(prompts.toneParser)
            .invoke({
              tweet: tweet.text,
              thread: tweet.thread || [],
            });

          logger.info('Tone analysis:', { toneAnalysis });

          return {
            tweet,
            decision,
            toneAnalysis,
          };
        }),
      );

      return {
        messages: [
          new AIMessage({
            content: JSON.stringify({
              tweets: parsedContent.tweets,
              currentTweetIndex: parsedContent.currentTweetIndex,
              batchToRespond: analyzedBatch,
              pendingEngagements: parsedContent.pendingEngagements,
              lastProcessedId: parsedContent.lastProcessedId,
            }),
          }),
        ],
      };
    } catch (error) {
      logger.error('Error in tone analysis node:', error);
      return { messages: [] };
    }
  };
};
