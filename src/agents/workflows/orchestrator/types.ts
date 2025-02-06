import { BaseMessage } from '@langchain/core/messages';
import { Runnable } from '@langchain/core/runnables';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { AIMessageChunk } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { WorkflowControl } from './nodes/inputPrompt.js';

export type OrchestratorPrompts = {
  inputPrompt: ChatPromptTemplate;
  messageSummaryPrompt: ChatPromptTemplate;
  workflowSummaryPrompt: ChatPromptTemplate;
};

export type OrchestratorConfig = {
  orchestratorModel: Runnable<BaseLanguageModelInput, AIMessageChunk>;
  toolNode: ToolNode;
  prompts: OrchestratorPrompts;
  pruningParameters: PruningParameters;
};

export type OrchestratorInput = {
  messages: BaseMessage[];
};

export type OrchestratorStateType = {
  messages: readonly BaseMessage[];
  error: Error | null;
  workflowControl: WorkflowControl | null;
};

export type PruningParameters = {
  maxWindowSummary: number;
  maxQueueSize: number;
};
