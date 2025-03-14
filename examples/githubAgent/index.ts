import { HumanMessage } from '@langchain/core/messages';
import { createGitHubTools, GitHubToolsSubset } from '../../src/agents/tools/github/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '../../src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from '../../src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from '../../src/agents/workflows/orchestrator/types.js';
import { validateLocalHash } from '../../src/blockchain/localHashStorage.js';
import { config } from '../../src/config/index.js';
import { createLogger } from '../../src/utils/logger.js';
const logger = createLogger('autonomous-web3-agent');

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  const githubToken = config.githubConfig.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN is required in the environment variables');
  }
  const githubTools = await createGitHubTools(githubToken, GitHubToolsSubset.ISSUES_CONTRIBUTOR);

  //Orchestrator config
  //use default orchestrator prompts with character config
  const prompts = await createPrompts(character);

  return {
    tools: [...githubTools],
    prompts,
  };
};

const orchestrationConfig = await orchestratorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(character, orchestrationConfig);
    }
    return runnerPromise;
  };
})();

const main = async () => {
  const runner = await orchestratorRunner();

  // Choose which message to start with
  const initialMessage = `
- Check for new issues in the repository, and create a new issue if you encounter an error or have a suggestion.
- Check for new mentions and notifications, and react to them (with reactions or comments) if you have a suggestion.
- Check for new pull requests, and review or comment on them if you have a suggestion.
- Check for new comments on issues and pull requests, and respond to them if you have a suggestion.
- React to new pull request and comments with reactions if you have like or dislike.`;

  try {
    await validateLocalHash();

    const result = await runner.runWorkflow({ messages: [new HumanMessage(initialMessage)] });

    logger.info('Workflow execution result:', { summary: result.summary });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ExitPromptError') {
      logger.info('Process terminated by user');
      process.exit(0);
    }
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

main();
