import { llmModels, LLMNodeConfiguration, LLMProvider, LLMSize } from '../services/llm/types.js';

export const llmDefaultConfig = {
  configuration: {
    large: {
      provider: LLMProvider.ANTHROPIC,
      model: llmModels.large.anthropic.claude35sonnet,
    },
    small: {
      provider: LLMProvider.OPENAI,
      model: llmModels.small.openai.gpt_4o_mini,
    },
  },
  nodes: {
    decision: {
      size: LLMSize.SMALL,
      temperature: 0.2,
    } as LLMNodeConfiguration,
    analyze: {
      size: LLMSize.LARGE,
      temperature: 0.5,
    } as LLMNodeConfiguration,
    generation: {
      size: LLMSize.LARGE,
      temperature: 0.8,
    } as LLMNodeConfiguration,
    response: {
      size: LLMSize.SMALL,
      temperature: 0.8,
    } as LLMNodeConfiguration,
    orchestrator: {
      size: LLMSize.LARGE,
      temperature: 0.2,
    } as LLMNodeConfiguration,
  },
};
