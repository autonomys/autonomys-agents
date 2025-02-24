import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { LLMConfiguration } from './types.js';
import { config as appConfig } from '../../config/index.js';
import { ChatGroq } from '@langchain/groq';
export class LLMFactory {
  static createModel(node: LLMConfiguration) {
    return this.createModelFromConfig(node);
  }

  static createModelFromConfig({ model, provider, temperature }: LLMConfiguration) {
    switch (provider) {
      case 'openai':
        const baseConfig = {
          apiKey: appConfig.llmConfig.OPENAI_API_KEY,
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
          apiKey: appConfig.llmConfig.ANTHROPIC_API_KEY,
          model,
          temperature,
        });
      case 'ollama':
        return new ChatOllama({
          baseUrl: appConfig.llmConfig.LLAMA_API_URL,
          model,
          temperature,
        });
      case 'deepseek':
        return new ChatOpenAI({
          apiKey: appConfig.llmConfig.DEEPSEEK_API_KEY,
          configuration: {
            baseURL: appConfig.llmConfig.DEEPSEEK_URL,
          },
          model,
          temperature,
        });
      case 'groq':
        return new ChatGroq({
          apiKey: appConfig.llmConfig.GROQ_API_KEY,
          model,
          temperature,
        });
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}

export type LLMModelType = ReturnType<typeof LLMFactory.createModelFromConfig>;
