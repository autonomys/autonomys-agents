import { ChatPromptTemplate } from '@langchain/core/prompts';
import { LLMFactory } from '../../../../services/llm/factory.js';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorStateType } from '../types.js';
import { finishedWorkflowParser } from './finishWorkflowPrompt.js';
import { AIMessage } from '@langchain/core/messages';
import { LLMConfiguration } from '../../../../services/llm/types.js';
import { attachLogger } from '../../../../api/server.js';
import { Logger } from 'winston';

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
}: {
  modelConfig: LLMConfiguration;
  finishWorkflowPrompt: ChatPromptTemplate;
  namespace: string;
}) => {
  const logger = attachLogger(createLogger(`${namespace}-finish-workflow-node`), namespace);
  const runNode = async (state: OrchestratorStateType) => {
    logger.info('Workflow Summary Node');

    const messages = state.messages
      .map(msg => {
        const content =
          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2);
        return `${msg.getType()}: ${content}`;
      })
      .join('\n');

    const formattedPrompt = await finishWorkflowPrompt.format({
      messages,
      currentTime: new Date().toISOString(),
    });

    const result = await LLMFactory.createModelFromConfig(modelConfig).invoke(formattedPrompt);
    const finishedWorkflow = await parseFinishedWorkflow(result.content, logger);

    logger.info('Finished Workflow:', { finishedWorkflow });

    return {
      messages: [new AIMessage({ content: result.content })],
      finishedWorkflow,
    };
  };
  return runNode;
};
