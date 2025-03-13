import { LLMConfiguration } from '../../../services/llm/types.js';
import {
  ModelConfigurations,
  MonitoringConfig,
  MonitoringOptions,
  Tools,
} from '../orchestrator/types.js';

export type SlackAgentOptions = {
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

export type SlackAgentConfig = {
  tools: Tools;
  modelConfigurations: ModelConfigurations;
  saveExperiences: boolean;
  monitoring: MonitoringConfig;
  recursionLimit: number;
};
