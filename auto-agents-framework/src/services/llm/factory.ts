import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export type LLMProvider = 'openai' | 'anthropic' | 'llama';

export class LLMFactory {
  static createModel(
    provider: LLMProvider,
    modelName: string,
    temperature: number,
  ): BaseChatModel {
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

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
} 