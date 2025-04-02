import { OrchestratorConfig, OrchestratorRunnerOptions } from '../orchestrator/types.js';

/**
 * Twitter-specific options that extend the base orchestrator options
 */
export type TwitterAgentOptions = OrchestratorRunnerOptions & {
  /**
   * Whether Twitter tweets should be actually posted (false for testing)
   */
  postTweets?: boolean;

  /**
   * Maximum depth of thread replies to process
   */
  maxThreadDepth?: number;
};

/**
 * Twitter agent config that extends the base orchestrator config
 */
export type TwitterAgentConfig = OrchestratorConfig & {
  /**
   * Whether Twitter tweets should be actually posted
   */
  postTweets: boolean;

  /**
   * Maximum depth of thread replies to process
   */
  maxThreadDepth: number;
};
