export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'groq' | 'gaianet';

export type LLMConfiguration = {
  provider: LLMProvider;
  model: string;
  temperature?: number;
};
