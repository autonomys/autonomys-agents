import { LLMProvider } from "./types.js";
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from "@langchain/ollama";
import { config } from "../../config/index.js";

export class LLMFactory {
  static createModel(
    provider: LLMProvider,
    model: string,
    temperature: number,
  ): ChatOpenAI | ChatAnthropic | ChatOllama {
    switch (provider) {
      case 'openai':
        return new ChatOpenAI({
          apiKey: config.llmConfig.OPENAI_API_KEY,
          model,
          temperature,
        });

      case 'anthropic':
        return new ChatAnthropic({
          apiKey: config.llmConfig.ANTHROPIC_API_KEY,
          model,
          temperature,
        });

      case 'llama':
        return new ChatOllama({
          baseUrl: config.llmConfig.LLAMA_API_URL || '',
          model,
          temperature,
          format: 'json',
          maxRetries: 3,
        });

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
} 