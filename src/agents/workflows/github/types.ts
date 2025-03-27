import { OrchestratorConfig, OrchestratorRunnerOptions } from '../orchestrator/types.js';
import { GitHubToolsSubset } from '../../tools/github/index.js';

/**
 * GitHub-specific options that extend the base orchestrator options
 */
export type GithubAgentOptions = OrchestratorRunnerOptions & {
  /**
   * GitHub token for authentication with GitHub API
   */
  githubToken?: string;

  /**
   * Subset of GitHub tools to use
   */
  toolsSubset?: GitHubToolsSubset;
};

/**
 * GitHub agent config that extends the base orchestrator config
 */
export type GithubAgentConfig = OrchestratorConfig & {
  /**
   * GitHub token for authentication with GitHub API
   */
  githubToken: string;

  /**
   * Subset of GitHub tools to use
   */
  toolsSubset: GitHubToolsSubset;
};
