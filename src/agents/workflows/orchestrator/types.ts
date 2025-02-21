import { BaseMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { LLMConfiguration } from '../../../services/llm/types.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { WorkflowControl } from './nodes/inputPrompt.js';

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

export type MonitoringOptions = {
  enabled?: boolean;
  messageCleaner?: (messages: BaseMessage[]) => unknown;
};

export type MonitoringConfig = {
  enabled: boolean;
  messageCleaner: (messages: BaseMessage[]) => unknown;
};

export type OrchestratorRunnerOptions = {
  modelConfigurations?: {
    inputModelConfig?: LLMConfiguration;
    messageSummaryModelConfig?: LLMConfiguration;
    finishWorkflowModelConfig?: LLMConfiguration;
  };
  tools?: Tools;
  prompts?: OrchestratorPrompts;
  namespace?: string;
  pruningParameters?: PruningParameters;
  vectorStore?: VectorDB;
  saveExperiences?: boolean;
  monitoring?: MonitoringOptions;
  recursionLimit?: number;
};

export type OrchestratorConfig = {
  modelConfigurations: ModelConfigurations;
  tools: Tools;
  prompts: OrchestratorPrompts;
  namespace: string;
  pruningParameters: PruningParameters;
  vectorStore: VectorDB;
  saveExperiences: boolean;
  monitoring: MonitoringConfig;
  recursionLimit: number;
};

export type OrchestratorInput = {
  messages: BaseMessage[];
};

export type OrchestratorStateType = {
  messages: readonly BaseMessage[];
  error: Error | null;
  workflowControl: WorkflowControl | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolCalls: any[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executedTools: any[] | null;
};

export type PruningParameters = {
  maxWindowSummary: number;
  maxQueueSize: number;
};

export type Tools = ToolNode['tools'];
