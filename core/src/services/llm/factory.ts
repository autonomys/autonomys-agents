import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { LLMConfiguration, LLMFactoryConfig } from './types.js';
import { ChatGroq } from '@langchain/groq';

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
        if (!model.includes('o3-mini') && !model.includes('o4-mini')) {
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
          clientOptions: {
            defaultHeaders: {
              'anthropic-beta': 'prompt-caching-2024-07-31',
            },
          },
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
