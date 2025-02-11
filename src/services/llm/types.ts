export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OLLAMA = 'ollama',
  DEEPSEEK = 'deepseek',
  GROQ = 'groq',
  GOOGLE = 'google',
}

export type LLMConfiguration = {
  provider: LLMProvider;
  model: string;
  temperature?: number;
};
