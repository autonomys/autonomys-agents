export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'groq';

export interface LLMFactoryConfig {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  LLAMA_API_URL?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_URL?: string;
  GROQ_API_KEY?: string;
}

export type LLMConfiguration = {
  provider: LLMProvider;
  model: string;
  temperature?: number;
};
