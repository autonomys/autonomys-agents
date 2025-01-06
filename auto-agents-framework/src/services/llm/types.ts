export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OLLAMA = 'ollama',
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
    anthropic: {
      claude3opus: 'claude-3-opus-20240229',
      claude3sonnet: 'claude-3-sonnet-20240229',
    },
    openai: {
      gpt4turbo: 'gpt-4-turbo',
      gpt4: 'gpt-4',
    },
    //placeholder
    ollama: {
      llama3: 'llama3.1',
    },
  },
  small: {
    openai: {
      gpt_4o_mini: 'gpt-4o-mini',
      gpt35turbo: 'gpt-3.5-turbo',
    },
    anthropic: {
      claude3haiku: 'claude-3-haiku-20240307',
    },
    //placeholder
    ollama: {
      llama3: 'llama3.1',
    },
  },
};
