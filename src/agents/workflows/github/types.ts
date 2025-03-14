import { LLMConfiguration } from '../../../services/llm/types.js';
import {
  ModelConfigurations,
  MonitoringConfig,
  MonitoringOptions,
  Tools,
} from '../orchestrator/types.js';

export type GithubAgentOptions = {
  tools?: Tools;
  modelConfigurations?: {
    inputModelConfig?: LLMConfiguration;
    messageSummaryModelConfig?: LLMConfiguration;
    finishWorkflowModelConfig?: LLMConfiguration;
  };
  saveExperiences?: boolean;
  monitoring?: MonitoringOptions;
  recursionLimit?: number;
};

export type GithubAgentConfig = {
  tools: Tools;
  modelConfigurations: ModelConfigurations;
  saveExperiences: boolean;
  monitoring: MonitoringConfig;
  recursionLimit: number;
};
