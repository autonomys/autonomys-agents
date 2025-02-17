import { BaseMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { WorkflowControl } from './nodes/inputPrompt.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { LLMConfiguration } from '../../../services/llm/types.js';

export type OrchestratorPrompts = {
  inputPrompt: ChatPromptTemplate;
  messageSummaryPrompt: ChatPromptTemplate;
  finishWorkflowPrompt: ChatPromptTemplate;
};

export type OrchestratorRunnerOptions = {
  modelConfig?: LLMConfiguration;
  tools?: Tools;
  prompts?: OrchestratorPrompts;
  namespace?: string;
  pruningParameters?: PruningParameters;
  vectorStore?: VectorDB;
};

export type OrchestratorConfig = {
  modelConfig: LLMConfiguration;
  tools: Tools;
  prompts: OrchestratorPrompts;
  namespace: string;
  pruningParameters: PruningParameters;
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

export type Tools = ToolNode['tools'];
