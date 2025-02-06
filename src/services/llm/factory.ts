import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { LLMNodeConfiguration, LLMProvider } from './types.js';
import { config as appConfig } from '../../config/index.js';

export class LLMFactory {
  static createModel(node: LLMNodeConfiguration) {
    return this.createModelFromConfig(node);
  }

  static createModelFromConfig(config: LLMNodeConfiguration) {
    switch (config.provider) {
      case LLMProvider.OPENAI:
        const baseConfig = {
          apiKey: appConfig.llmConfig.OPENAI_API_KEY,
          model: config.model,
        };
        if (!config.model.includes('o3-mini')) {
          return new ChatOpenAI({
            ...baseConfig,
            temperature: config.temperature,
          });
        }
        return new ChatOpenAI(baseConfig);
      case LLMProvider.ANTHROPIC:
        return new ChatAnthropic({
          apiKey: appConfig.llmConfig.ANTHROPIC_API_KEY,
          model: config.model,
          temperature: config.temperature,
        });
      case LLMProvider.OLLAMA:
        return new ChatOllama({
          baseUrl: appConfig.llmConfig.LLAMA_API_URL,
          model: config.model,
          temperature: config.temperature,
        });
      case LLMProvider.DEEPSEEK:
        return new ChatOpenAI({
          apiKey: appConfig.llmConfig.DEEPSEEK_API_KEY,
          configuration: {
            baseURL: appConfig.llmConfig.DEEPSEEK_URL,
          },
          model: config.model,
          temperature: config.temperature,
        });
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}

export type LLMModelType = ReturnType<typeof LLMFactory.createModelFromConfig>;
