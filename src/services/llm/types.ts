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

export enum LLMSize {
  SMALL = 'small',
  LARGE = 'large',
}

export type LLMNodeConfiguration = {
  size: LLMSize;
  temperature: number;
};

export const llmModels = {
  large: {
    openai: {
      gpt4o: 'gpt-4o',
    },
    anthropic: {
      claude35sonnet: 'claude-3-5-sonnet-latest',
    },
    deepseek: {
      deepseekChat: 'deepseek-chat',
      deepseekReasoner: 'deepseek-reasoner',
    },
    //placeholder
    ollama: {
      llama3: 'llama3.1',
    },
  },
  small: {
    openai: {
      gpt_4o_mini: 'gpt-4o-mini',
    },
    anthropic: {
      claude35haiku: 'claude-3-5-haiku-latest',
    },
    //placeholder
    ollama: {
      llama3: 'llama3.1',
    },
  },
};
