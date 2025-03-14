import { LLMFactory } from '../../../../services/llm/factory.js';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorStateType, Tools } from '../types.js';
import { workflowControlParser } from './inputPrompt.js';
import { LLMConfiguration } from '../../../../services/llm/types.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Logger } from 'winston';
import { attachLogger } from '../../../../api/server.js';

const parseWorkflowControl = async (content: unknown, logger: Logger) => {
  if (
    typeof content === 'string' &&
    content != '' &&
    JSON.stringify(content).includes('shouldStop')
  ) {
    try {
      logger.info('Parsing workflow control - Input Node:', { content });
      return await workflowControlParser.parse(content);
    } catch (error) {
      logger.error('Failed to parse workflow control. Applying fallback termination.', {
        error,
        content,
      });
      return { shouldStop: true, reason: 'Failed to parse control message' };
    }
  }
  return undefined;
};

export const createInputNode = ({
  modelConfig,
  inputPrompt,
  tools,
  namespace,
}: {
  modelConfig: LLMConfiguration;
  inputPrompt: ChatPromptTemplate;
  tools: Tools;
  namespace: string;
}) => {
  const logger = attachLogger(createLogger(`${namespace}-input-node`), namespace);
  const runNode = async (state: OrchestratorStateType) => {
    logger.info('MODEL CONFIG - Input Node:', { modelConfig });
    const { messages, executedTools } = state;
    logger.debug('Running input node with messages:', {
      messages: messages.map(message => message.content),
    });

    const availableTools = tools.map(tool => ({ name: tool.name }));

    const formattedPrompt = await inputPrompt.format({
      messages: messages.map(message => message.content),
      executedTools: executedTools?.map(tool => tool),
      availableTools: availableTools,
    });

    logger.debug('Formatted Prompt - Input Node:', { formattedPrompt });

    const result = await LLMFactory.createModel(modelConfig)
      .bindTools(tools)
      .invoke(formattedPrompt);

    const toolCalls = result.tool_calls;

    logger.debug('Tool Calls - Input Node:', { toolCalls });
    const usage = result.additional_kwargs?.usage as
      | { input_tokens: number; output_tokens: number }
      | undefined;
    logger.info('Result - Input Node:', {
      content: result.content,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
    });

    const workflowControl = await parseWorkflowControl(result.content, logger);

    const newMessage = { messages: [result] };
    if (workflowControl) {
      return { ...newMessage, workflowControl, toolCalls };
    }
    return { ...newMessage, toolCalls };
  };
  return runNode;
};
