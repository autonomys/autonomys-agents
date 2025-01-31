import { AIMessage } from '@langchain/core/messages';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
import { config } from '../../../../config/index.js';
const logger = createLogger('summary-node');

export const createSummaryNode = ({ orchestratorModel, prompts }: OrchestratorConfig) => {
  const runNode = async (state: typeof OrchestratorState.State) => {
    logger.info('Summary Node');
    logger.info('State size:', { size: state.messages.length });

    if (state.messages.length <= config.orchestratorConfig.MAX_WINDOW_SUMMARY) {
      logger.info('Not summarizing, not enough messages');
      return { messages: state.messages };
    }

    // Skip first message if it's a summary
    const messagesToSummarize = state.messages.length > 1 ? state.messages.slice(1) : [];

    if (messagesToSummarize.length === 0) {
      return { messages: [] };
    }

    const newMessages = messagesToSummarize
      .map(msg => {
        const content =
          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2);
        return `${msg.getType()}: ${content}`;
      })
      .join('\n');

    const formattedPrompt = await prompts.summaryPrompt.format({
      prevSummary: state.messages[0]?.content || 'No previous summary',
      newMessages,
    });

    logger.info('Formatted prompt:', { formattedPrompt });
    await new Promise(resolve => setTimeout(resolve, 10000));
    const newSummary = await orchestratorModel.invoke(formattedPrompt);
    logger.info('New Summary Result:', { newSummary });
    return {
      messages: [
        new AIMessage({ content: newSummary.content }),
        ...state.messages.slice(-(config.orchestratorConfig.MAX_WINDOW_SUMMARY - 1)),
      ],
    };
  };
  return runNode;
};
