import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { LLMProvider, LLMConfiguration, LLMNodeConfiguration } from './types.js';
import { llmConfig } from '../../config/llm.js';
import { config as appConfig } from '../../config/index.js';

export class LLMFactory {
  static createModel(node: LLMNodeConfiguration) {
    const cfg = llmConfig.configuration[node.size];
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
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}