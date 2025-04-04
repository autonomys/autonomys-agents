import { OrchestratorConfig, OrchestratorRunnerOptions } from '../orchestrator/types.js';

/**
 * Slack-specific options that extend the base orchestrator options
 */
export type SlackAgentOptions = OrchestratorRunnerOptions & {
  /**
   * Slack token for authentication with Slack API
   */
  slackToken?: string;
};

/**
 * Slack agent config that extends the base orchestrator config
 */
export type SlackAgentConfig = OrchestratorConfig & {
  /**
   * Slack token for authentication with Slack API
   */
  slackToken: string;
};
