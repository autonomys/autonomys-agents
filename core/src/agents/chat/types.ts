import { DynamicStructuredTool } from '@langchain/core/tools';
import { LLMConfiguration } from '../../services/llm/types.js';
import { ChatState } from './state.js';
import { createChatWorkflow } from './workflow.js';

// Modify the InputNodeFunction type to accept any message format
export type InputNodeFunction = (state: typeof ChatState.State) => Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolCalls: any[] | undefined;
}>;

export type ChatNodeConfig = {
  tools: DynamicStructuredTool[];
  modelConfig: LLMConfiguration;
};

export type ChatWorkflow = ReturnType<typeof createChatWorkflow>;
