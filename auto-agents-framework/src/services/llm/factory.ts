import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatLlama } from './chat_llama.js';
export type LLMProvider = 'openai' | 'anthropic' | 'llama';
import { ChatOllama } from "@langchain/ollama";
import { Ollama } from "@langchain/community/llms/ollama";

export class LLMFactory {
  static createModel(
    provider: LLMProvider,
    modelName: string,
    temperature: number,
  ): ChatOpenAI | ChatAnthropic | ChatOllama {
    switch (provider) {
      case 'openai':
        return new ChatOpenAI({
          modelName,
          temperature,
        });

      case 'anthropic':
        return new ChatAnthropic({
          modelName,
          temperature,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });

      case 'llama':
        return new ChatOllama({
          baseUrl: process.env.LLAMA_API_URL || '',
          model: modelName,
          temperature,
          maxRetries: 3,
        });

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
} 