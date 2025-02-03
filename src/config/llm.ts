import { llmModels, LLMNodeConfiguration, LLMProvider } from '../services/llm/types.js';

export const llmDefaultConfig = {
  nodes: {
    decision: {
      provider: LLMProvider.OPENAI,
      model: llmModels.openai.gpt4o_mini,
      temperature: 0.2,
    } as LLMNodeConfiguration,
    analyze: {
      provider: LLMProvider.ANTHROPIC,
      model: llmModels.anthropic.claude35sonnet,
      temperature: 0.5,
    } as LLMNodeConfiguration,
    generation: {
      provider: LLMProvider.ANTHROPIC,
      model: llmModels.anthropic.claude35sonnet,
      temperature: 0.8,
    } as LLMNodeConfiguration,
    response: {
      provider: LLMProvider.OPENAI,
      model: llmModels.openai.gpt4o_mini,
      temperature: 0.8,
    } as LLMNodeConfiguration,
    orchestrator: {
      provider: LLMProvider.ANTHROPIC,
      model: llmModels.anthropic.claude35sonnet,
      temperature: 0.2,
    } as LLMNodeConfiguration,
    prompt_summarizer: {
      provider: LLMProvider.OPENAI,
      model: llmModels.openai.gpt4o_mini,
      temperature: 0.2,
    } as LLMNodeConfiguration,
  },
};
