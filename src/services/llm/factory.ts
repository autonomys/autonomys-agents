import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { LLMConfiguration, LLMNodeConfiguration, LLMProvider } from './types.js';
import { config as appConfig } from '../../config/index.js';

export class LLMFactory {
  static createModel(node: LLMNodeConfiguration) {
    const cfg = appConfig.llmConfig.configuration[node.size];
    return this.createModelFromConfig(cfg, node.temperature);
  }

  static createModelFromConfig(config: LLMConfiguration, temperature: number) {
    switch (config.provider) {
      case LLMProvider.OPENAI:
        return new ChatOpenAI({
          apiKey: appConfig.llmConfig.OPENAI_API_KEY,
          model: config.model,
          temperature,
        });
      case LLMProvider.ANTHROPIC:
        return new ChatAnthropic({
          apiKey: appConfig.llmConfig.ANTHROPIC_API_KEY,
          model: config.model,
          temperature,
        });
      case LLMProvider.OLLAMA:
        return new ChatOllama({
          baseUrl: appConfig.llmConfig.LLAMA_API_URL,
          model: config.model,
          temperature,
        });
      case LLMProvider.DEEPSEEK:
        return new ChatOpenAI({
          apiKey: appConfig.llmConfig.DEEPSEEK_API_KEY,
          configuration: {
            baseURL: appConfig.llmConfig.DEEPSEEK_URL,
          },
          model: config.model,
          temperature,
        });
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}
