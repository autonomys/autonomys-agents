import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { LLMConfiguration } from './types.js';
import { ChatGroq } from '@langchain/groq';
import { ChatDeepSeek } from '@langchain/deepseek';
export class LLMFactory {
  static createModel(node: LLMConfiguration) {
    return this.createModelFromConfig(node);
  }

  static createModelFromConfig({ model, provider, temperature }: LLMConfiguration) {
    switch (provider) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY is not set');
        }
        const baseConfig = {
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
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY is not set');
        }
        return new ChatAnthropic({
          model,
          temperature,
          clientOptions: {
            defaultHeaders: {
              'anthropic-beta': 'prompt-caching-2024-07-31',
            },
          },
        });
      case 'ollama':
        if (!process.env.OLLAMA_API_URL) {
          throw new Error('OLLAMA_API_URL is not set');
        }
        return new ChatOllama({
          baseUrl: process.env.OLLAMA_API_URL,
          model,
          temperature,
        });
      case 'deepseek':
        if (!process.env.DEEPSEEK_API_KEY) {
          throw new Error('DEEPSEEK_API_KEY is not set');
        }
        return new ChatDeepSeek({
          model,
          temperature,
        });
      case 'groq':
        if (!process.env.GROQ_API_KEY) {
          throw new Error('GROQ_API_KEY is not set');
        }
        return new ChatGroq({
          model,
          temperature,
        });
      case 'gaianet':
        if (!process.env.GAIANET_BASE_URL) {
          throw new Error('GAIA_BASE_URL is not set');
        }
        return new ChatOpenAI({
          model,
          temperature,
          apiKey: process.env.GAIANET_API_KEY,
          configuration: {
            baseURL: process.env.GAIANET_BASE_URL,
          },
        });
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}

export type LLMModelType = ReturnType<typeof LLMFactory.createModelFromConfig>;
