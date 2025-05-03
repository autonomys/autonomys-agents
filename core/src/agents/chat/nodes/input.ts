import { LLMConfiguration, LLMFactory, LLMFactoryConfig } from '../../../services/index.js';
import { ChatState } from '../state.js';
import { promptTemplate } from './prompt.js';
import { createLogger } from '../../../utils/logger.js';
import { InputNodeFunction } from '../types.js';
import { DynamicStructuredTool } from '@langchain/core/tools';
const logger = createLogger('chat-input');

const createInputNode = ({
  modelConfig,
  tools,
  llmConfig,
}: {
  modelConfig: LLMConfiguration;
  tools: DynamicStructuredTool[];
  llmConfig: LLMFactoryConfig;
}): InputNodeFunction => {
  const runNode = async (state: typeof ChatState.State) => {
    const prompt = await promptTemplate.invoke(state);
    const llmModel = LLMFactory.createModel(modelConfig, llmConfig).bindTools(tools);
    const model = await llmModel.invoke(prompt);
    logger.info('Model response', { model });
    const toolCalls = model.tool_calls;

    logger.info('Tool Calls - Input Node:', { toolCalls });
    const usage = model.additional_kwargs?.usage;
    logger.info('Result - Input Node:', {
      content: model.content,
      usage,
    });
    return {
      messages: [
        ...state.messages,
        {
          role: 'assistant',
          content: model.content,
        },
      ],
      toolCalls,
    };
  };
  return runNode;
};

export { createInputNode };
