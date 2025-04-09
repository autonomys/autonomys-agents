import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { LLMConfiguration } from './types.js';
import { ChatGroq } from '@langchain/groq';

// Define a config interface
export interface LLMFactoryConfig {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  LLAMA_API_URL?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_URL?: string;
  GROQ_API_KEY?: string;
}

export class LLMFactory {
  static createModel(node: LLMConfiguration, config: LLMFactoryConfig) {
    return this.createModelFromConfig(node, config);
  }

  static createModelFromConfig(
    { model, provider, temperature }: LLMConfiguration,
    config: LLMFactoryConfig,
  ) {
    switch (provider) {
      case 'openai':
        const baseConfig = {
          apiKey: config.OPENAI_API_KEY,
          model,
        };
        if (!model.includes('o3-mini')) {
          return new ChatOpenAI({
            ...baseConfig,
            temperature,
          });
        }
        return new ChatOpenAI(baseConfig);
      case 'anthropic':
        return new ChatAnthropic({
          apiKey: config.ANTHROPIC_API_KEY,
          model,
          temperature,
        });
      case 'ollama':
        return new ChatOllama({
          baseUrl: config.LLAMA_API_URL,
          model,
          temperature,
        });
      case 'deepseek':
        return new ChatOpenAI({
          apiKey: config.DEEPSEEK_API_KEY,
          configuration: {
            baseURL: config.DEEPSEEK_URL,
          },
          model,
          temperature,
        });
      case 'groq':
        return new ChatGroq({
          apiKey: config.GROQ_API_KEY,
          model,
          temperature,
        });
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}

export type LLMModelType = ReturnType<typeof LLMFactory.createModelFromConfig>;
