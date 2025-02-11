export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'groq' | 'google';

export type LLMConfiguration = {
  provider: LLMProvider;
  model: string;
  temperature?: number;
};
