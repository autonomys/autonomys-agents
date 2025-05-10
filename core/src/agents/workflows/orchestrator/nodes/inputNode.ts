import { LLMFactory } from '../../../../services/llm/factory.js';
import { createLogger } from '../../../../utils/logger.js';
import { ApiConfig, InputNodeFunction, OrchestratorStateType, Tools } from '../types.js';
import { LLMConfiguration } from '../../../../services/llm/types.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { attachLogger } from '../../../../api/server.js';
import { prepareAnthropicPrompt } from './utils.js';
import { toolInterfaceConverter } from '../../utils.js';
import { DynamicStructuredTool, StructuredToolInterface } from '@langchain/core/tools';

export const createInputNode = ({
  modelConfig,
  inputPrompt,
  tools,
  namespace,
  apiConfig,
}: {
  modelConfig: LLMConfiguration;
  inputPrompt: ChatPromptTemplate;
  tools: Tools;
  namespace: string;
  apiConfig: ApiConfig;
}): InputNodeFunction => {
  const logger = attachLogger(
    createLogger(`${namespace}-input-node`),
    namespace,
    apiConfig.apiEnabled ?? false,
  );
  const toolsNewInterface = tools.map(tool =>
    toolInterfaceConverter(tool as DynamicStructuredTool | StructuredToolInterface),
  );
  const runNode = async (state: OrchestratorStateType) => {
    logger.info('MODEL CONFIG - Input Node:', { modelConfig });
    const { messages, executedTools } = state;
    logger.debug('Running input node with messages:', {
      messages: messages.map(message => message.content),
    });

    const availableTools = tools.map(tool => ({ name: tool.name }));

    const formattedMessages = await inputPrompt.formatMessages({
      messages: messages.map(message => message.content),
      executedTools: executedTools?.map(tool => tool),
      availableTools: availableTools,
    });

    logger.debug('Formatted Messages - Input Node:', { formattedMessages });

    // Prepare prompt for Anthropic (adds cache_control if applicable)
    const promptToSend =
      modelConfig.provider === 'anthropic'
        ? prepareAnthropicPrompt(formattedMessages, logger)
        : formattedMessages;

    const result = await LLMFactory.createModel(modelConfig)
      .bindTools(toolsNewInterface)
      .invoke(promptToSend);

    const toolCalls = result.tool_calls;

    logger.info('Tool Calls - Input Node:', { toolCalls });
    const usage = result.additional_kwargs?.usage;
    logger.info('Result - Input Node:', {
      content: result.content,
      usage,
    });

    const newMessage = { messages: [result] };

    return { ...newMessage, toolCalls };
  };
  return runNode;
};
