import { ChatNodeConfig } from './types.js';
import { LLMConfiguration } from '../../services/llm/types.js';

const defaultModelConfig: LLMConfiguration = {
  model: 'claude-3-5-haiku-latest',
  provider: 'anthropic',
  temperature: 0.5,
};

export const createChatNodeConfig = (options: ChatNodeConfig): ChatNodeConfig => {
  const modelConfig = options.modelConfig ?? defaultModelConfig;
  const tools = options.tools;
  const promptTemplate = options.promptTemplate;
  return { modelConfig, tools, promptTemplate };
};
