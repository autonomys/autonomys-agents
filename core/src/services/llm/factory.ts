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

  static createModelFromConfig(
    { model, provider, temperature }: LLMConfiguration ) {
    switch (provider) {
      case 'openai':
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
        return new ChatOllama({
          baseUrl: process.env.OLLAMA_API_URL,
          model,
          temperature,
        });
      case 'deepseek':
        return new ChatDeepSeek({
          model,
          temperature,
        });
      case 'groq':
        return new ChatGroq({
          model,
          temperature,
        });
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}

export type LLMModelType = ReturnType<typeof LLMFactory.createModelFromConfig>;
