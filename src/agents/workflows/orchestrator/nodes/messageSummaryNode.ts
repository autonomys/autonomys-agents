import { AIMessage } from '@langchain/core/messages';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
import { config } from '../../../../config/index.js';
import { VectorDB } from '../../../../services/vectorDb/VectorDB.js';
const logger = createLogger('message-summary-node');

export const createMessageSummaryNode = (
  { orchestratorModel, prompts }: OrchestratorConfig,
  vectorStore: VectorDB,
) => {
  const runNode = async (state: typeof OrchestratorState.State) => {
    logger.info('MessageSummary Node');
    logger.info('State size:', { size: state.messages.length });

    if (state.messages.length > config.orchestratorConfig.MAX_QUEUE_SIZE) {
      const prevSummary = state.messages[1]?.content || 'No previous summary';
      const messagesToSummarize = state.messages.slice(
        1,
        config.orchestratorConfig.MAX_WINDOW_SUMMARY,
      );

      const newMessages = messagesToSummarize
        .map(msg => {
          const content =
            typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2);
          return `${msg.getType()}: ${content}`;
        })
        .join('\n');

      const formattedPrompt = await prompts.messageSummaryPrompt.format({
        prevSummary,
        newMessages,
      });

      const newSummary = await orchestratorModel.invoke(formattedPrompt);
      logger.info('New Summary Result:', { newSummary });

      const summaryContent =
        typeof newSummary.content === 'string'
          ? newSummary.content
          : JSON.stringify(newSummary.content, null, 2);

      await vectorStore.insert(summaryContent);

      return {
        messages: [
          new AIMessage({ content: `Summary of conversation earlier: ${summaryContent}` }),
        ],
      };
    }

    logger.info('Not summarizing, not enough messages');
    return { messages: [] };
  };
  return runNode;
};
