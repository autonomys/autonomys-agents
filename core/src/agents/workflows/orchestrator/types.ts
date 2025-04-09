import { BaseMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { LLMConfiguration } from '../../../services/llm/types.js';
import { Logger } from 'winston';
import { ExperienceManager } from '../../../blockchain/agentExperience/types.js';

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

export type MonitoringConfig =
  | {
      enabled: true;
      monitoringExperienceManager: ExperienceManager;
      messageCleaner?: (messages: BaseMessage[]) => unknown;
    }
  | {
      enabled: false;
      monitoringExperienceManager?: never;
      messageCleaner?: never;
    };

export type ExperienceConfig =
  | {
      saveExperiences: true;
      experienceManager: ExperienceManager;
    }
  | {
      saveExperiences: false;
      experienceManager?: never;
    };

export type CharacterDataPathConfig = {
  dataPath: string;
};

export type ApiConfig = {
  authFlag?: boolean;
  authToken?: string;
  allowedOrigins?: string[];
  port?: number;
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
  experienceConfig?: ExperienceConfig;
  monitoringConfig?: MonitoringConfig;
  characterDataPathConfig?: CharacterDataPathConfig;
  recursionLimit?: number;
  apiConfig?: ApiConfig;
  logger?: Logger;
};

export type OrchestratorConfig = {
  modelConfigurations: ModelConfigurations;
  tools: Tools;
  prompts: OrchestratorPrompts;
  namespace: string;
  pruningParameters: PruningParameters;
  experienceConfig: ExperienceConfig;
  monitoringConfig: MonitoringConfig;
  characterDataPathConfig: CharacterDataPathConfig;
  recursionLimit: number;
  apiConfig: ApiConfig;
  logger?: Logger;
};

export type OrchestratorInput = {
  messages: BaseMessage[];
};

export type OrchestratorStateType = {
  messages: readonly BaseMessage[];
  error: Error | null;
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
