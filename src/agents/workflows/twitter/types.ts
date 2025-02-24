import { LLMConfiguration } from '../../../services/llm/types.js';
import {
  ModelConfigurations,
  MonitoringConfig,
  MonitoringOptions,
  Tools,
} from '../orchestrator/types.js';

export type TwitterAgentOptions = {
  tools?: Tools;
  modelConfigurations?: {
    inputModelConfig?: LLMConfiguration;
    messageSummaryModelConfig?: LLMConfiguration;
    finishWorkflowModelConfig?: LLMConfiguration;
  };
  postTweets?: boolean;
  saveExperiences?: boolean;
  monitoring?: MonitoringOptions;
  recursionLimit?: number;
};

export type TwitterAgentConfig = {
  tools: Tools;
  modelConfigurations: ModelConfigurations;
  postTweets: boolean;
  maxThreadDepth: number;
  saveExperiences: boolean;
  monitoring: MonitoringConfig;
  recursionLimit: number;
};
