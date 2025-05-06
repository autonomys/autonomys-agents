import { ChatPromptTemplate } from '@langchain/core/prompts';
import { LLMConfiguration } from '../../../../services/llm/types.js';
import { LLMFactory } from '../../../../services/llm/factory.js';
import { createLogger } from '../../../../utils/logger.js';
import { ApiConfig, OrchestratorStateType } from '../types.js';
import { finishedWorkflowParser } from './finishWorkflowPrompt.js';
import { AIMessage } from '@langchain/core/messages';
import { attachLogger } from '../../../../api/server.js';
import { Logger } from 'winston';
import { prepareAnthropicPrompt } from './utils.js';

export const parseFinishedWorkflow = async (content: unknown, logger: Logger) => {
  const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  if (typeof contentString === 'string') {
    try {
      return await finishedWorkflowParser.parse(contentString);
    } catch (error) {
      logger.error('Failed to parse workflow control. Applying fallback termination.', {
        error,
        content,
      });
      return { summary: 'Failed to parse workflow content' };
    }
  }
  return { summary: 'Failed to parse workflow content' };
};

export const createFinishWorkflowNode = ({
  modelConfig,
  finishWorkflowPrompt,
  namespace,
  apiConfig,
}: {
  modelConfig: LLMConfiguration;
  finishWorkflowPrompt: ChatPromptTemplate;
  namespace: string;
  apiConfig: ApiConfig;
}) => {
  const logger = attachLogger(
    createLogger(`${namespace}-finish-workflow-node`),
    namespace,
    apiConfig.apiEnabled ?? false,
  );
  const runNode = async (state: OrchestratorStateType) => {
    logger.info('Workflow Summary Node');

    const messages = state.messages
      .map(msg => {
        const content =
          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2);
        return `${msg.getType()}: ${content}`;
      })
      .join('\n');

    const formattedMessages = await finishWorkflowPrompt.formatMessages({
      messages,
      currentTime: new Date().toISOString(),
    });

    logger.debug('Formatted Messages - FinishWorkflow Node:', { formattedMessages });

    // Prepare prompt for Anthropic (adds cache_control if applicable)
    const promptToSend =
      modelConfig.provider === 'anthropic'
        ? prepareAnthropicPrompt(formattedMessages, logger)
        : formattedMessages;

    const result = await LLMFactory.createModelFromConfig(modelConfig).invoke(promptToSend);
    const finishedWorkflow = await parseFinishedWorkflow(result.content, logger);

    logger.info('Finished Workflow:', { finishedWorkflow });

    return {
      messages: [new AIMessage({ content: result.content })],
      finishedWorkflow,
    };
  };
  return runNode;
};
