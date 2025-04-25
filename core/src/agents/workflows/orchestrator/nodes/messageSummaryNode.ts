import { AIMessage } from '@langchain/core/messages';
import { createLogger } from '../../../../utils/logger.js';
import { ApiConfig, OrchestratorStateType } from '../types.js';
import { LLMFactory } from '../../../../services/llm/factory.js';
import { LLMConfiguration, LLMFactoryConfig } from '../../../../services/llm/types.js';
import { PruningParameters } from '../types.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { attachLogger } from '../../../../api/server.js';
import { prepareAnthropicPrompt } from './utils.js';

export const createMessageSummaryNode = ({
  modelConfig,
  messageSummaryPrompt,
  pruningParameters,
  namespace,
  apiConfig,
  llmConfig,
}: {
  modelConfig: LLMConfiguration;
  messageSummaryPrompt: ChatPromptTemplate;
  pruningParameters: PruningParameters;
  namespace: string;
  apiConfig: ApiConfig;
  llmConfig: LLMFactoryConfig;
}) => {
  const logger = attachLogger(
    createLogger(`${namespace}-message-summary-node`),
    namespace,
    apiConfig.apiEnabled ?? false,
  );
  const runNode = async (state: OrchestratorStateType) => {
    logger.info('MessageSummary Node');
    logger.info('State size:', { size: state.messages.length });

    const prevSummary = state.messages[1]?.content || 'No previous summary';
    const messagesToSummarize = state.messages.slice(1, pruningParameters.maxWindowSummary);

    const newMessages = messagesToSummarize
      .map(msg => {
        const content =
          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2);
        return `${msg.getType()}: ${content}`;
      })
      .join('\n');

    const formattedMessages = await messageSummaryPrompt.formatMessages({
      prevSummary,
      newMessages,
    });

    logger.debug('Formatted Messages - MessageSummary Node:', { formattedMessages });

    // Prepare prompt for Anthropic (adds cache_control if applicable)
    const promptToSend =
      modelConfig.provider === 'anthropic'
        ? prepareAnthropicPrompt(formattedMessages, logger)
        : formattedMessages;

    const newSummary = await LLMFactory.createModel(modelConfig, llmConfig).invoke(promptToSend);
    logger.info('New Summary Result:', { newSummary });

    const summaryContent =
      typeof newSummary.content === 'string'
        ? newSummary.content
        : JSON.stringify(newSummary.content, null, 2);

    return {
      messages: [new AIMessage({ content: `Summary of conversation earlier: ${summaryContent}` })],
    };
  };
  return runNode;
};
