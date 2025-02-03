export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OLLAMA = 'ollama',
  DEEPSEEK = 'deepseek',
}

export type LLMConfiguration = {
  provider: LLMProvider;
  model: string;
};

export type LLMNodeConfiguration = {
  provider: LLMProvider;
  model: string;
  temperature: number;
};

export const llmModels = {
  openai: {
    gpt4_turbo: 'gpt-4-turbo-preview',
    gpt4o_mini: 'gpt-4o-mini',
    o3_mini: 'o3-mini',
  },
  anthropic: {
    claude35sonnet: 'claude-3-5-sonnet-latest',
    claude35haiku: 'claude-3-5-haiku-latest',
  },
  deepseek: {
    deepseekChat: 'deepseek-chat',
    deepseekReasoner: 'deepseek-reasoner',
  },
  ollama: {
    llama3: 'llama3.1',
  },
};
