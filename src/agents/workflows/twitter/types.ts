import { LLMConfiguration } from '../../../services/llm/types.js';
import { ModelConfigurations, Tools } from '../orchestrator/types.js';

export type TwitterAgentOptions = {
  tools?: Tools;
  modelConfigurations?: {
    inputModelConfig?: LLMConfiguration;
    messageSummaryModelConfig?: LLMConfiguration;
    finishWorkflowModelConfig?: LLMConfiguration;
  };
  postTweets?: boolean;
  autoDriveUploadEnabled?: boolean;
};

export type TwitterAgentConfig = {
  tools: Tools;
  modelConfigurations: ModelConfigurations;
  postTweets: boolean;
  autoDriveUploadEnabled: boolean;
};
