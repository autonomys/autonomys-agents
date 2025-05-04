import { ChatNodeConfig } from './types.js';
import { LLMConfiguration } from '../../services/llm/types.js';
import { defaultTools } from './tools.js';

const defaultModelConfig: LLMConfiguration = {
  model: 'gpt-4o-mini',
  provider: 'openai',
  temperature: 0.5,
};

export const createChatNodeConfig = (options: ChatNodeConfig): ChatNodeConfig => {
  const modelConfig = options.modelConfig ?? defaultModelConfig;
  const tools = options?.tools ?? defaultTools;
  const llmConfig = options.llmConfig;
  return { modelConfig, tools, llmConfig };
};
