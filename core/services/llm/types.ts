export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'groq';

export type LLMConfiguration = {
  provider: LLMProvider;
  model: string;
  temperature?: number;
};
