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

export type ModelConfigurations = {
  inputModelConfig: LLMConfiguration;
  messageSummaryModelConfig: LLMConfiguration;
  finishWorkflowModelConfig: LLMConfiguration;
};

export type OrchestratorRunnerOptions = {
  modelConfigurations?: ModelConfigurations;
  tools?: Tools;
  prompts?: OrchestratorPrompts;
  namespace?: string;
  pruningParameters?: PruningParameters;
  vectorStore?: VectorDB;
  autoDriveUploadEnabled?: boolean;
};

export type OrchestratorConfig = {
  modelConfigurations: ModelConfigurations;
  tools: Tools;
  prompts: OrchestratorPrompts;
  namespace: string;
  pruningParameters: PruningParameters;
  vectorStore: VectorDB;
  autoDriveUploadEnabled: boolean;
};

export type OrchestratorInput = {
  messages: BaseMessage[];
};

export type OrchestratorStateType = {
  messages: readonly BaseMessage[];
  error: Error | null;
  workflowControl: WorkflowControl | null;
  toolCalls: any[] | null;
  executedTools: any[] | null;
};

export type PruningParameters = {
  maxWindowSummary: number;
  maxQueueSize: number;
};

export type Tools = ToolNode['tools'];
