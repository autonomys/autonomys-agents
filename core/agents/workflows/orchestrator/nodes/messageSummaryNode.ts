import { AIMessage } from '@langchain/core/messages';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorStateType } from '../types.js';
import { LLMFactory } from '../../../../services/llm/factory.js';
import { LLMConfiguration } from '../../../../services/llm/types.js';
import { PruningParameters } from '../types.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { attachLogger } from '../../../../api/server.js';

export const createMessageSummaryNode = ({
  modelConfig,
  messageSummaryPrompt,
  pruningParameters,
  namespace,
}: {
  modelConfig: LLMConfiguration;
  messageSummaryPrompt: ChatPromptTemplate;
  pruningParameters: PruningParameters;
  namespace: string;
}) => {
  const logger = attachLogger(createLogger(`${namespace}-message-summary-node`), namespace);
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

    const formattedPrompt = await messageSummaryPrompt.format({
      prevSummary,
      newMessages,
    });

    const newSummary = await LLMFactory.createModel(modelConfig).invoke(formattedPrompt);
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
