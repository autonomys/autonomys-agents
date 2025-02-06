import { BaseMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { WorkflowControl } from './nodes/inputPrompt.js';
import { LLMModelType } from '../../../services/llm/factory.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
export type OrchestratorPrompts = {
  inputPrompt: ChatPromptTemplate;
  messageSummaryPrompt: ChatPromptTemplate;
  workflowSummaryPrompt: ChatPromptTemplate;
};

export type OrchestratorConfig = {
  orchestratorModel: LLMModelType;
  toolNode: ToolNode;
  prompts: OrchestratorPrompts;
  pruningParameters: PruningParameters;
  namespace: string;
  vectorStore: VectorDB;
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
