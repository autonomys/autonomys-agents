import { LLMFactory } from '../../../../services/llm/factory.js';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorStateType, Tools } from '../types.js';
import { LLMConfiguration } from '../../../../services/llm/types.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { attachLogger } from '../../../../api/server.js';

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

    // TODO: The below method is specificly for Anthropic. tool_choice: 'required  is for open ai that can be added later.
    const result = await LLMFactory.createModel(modelConfig)
      .bindTools(tools, { tool_choice: 'any' })
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

    const newMessage = { messages: [result] };

    return { ...newMessage, toolCalls };
  };
  return runNode;
};
