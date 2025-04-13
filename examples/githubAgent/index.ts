import { HumanMessage } from '@langchain/core/messages';
import { GitHubToolsSubset } from 'autonomys-agents-core/src/agents/tools/github/index.js';
import { createAllSchedulerTools } from 'autonomys-agents-core/src/agents/tools/scheduler/index.js';
import { createGithubAgent } from 'autonomys-agents-core/src/agents/workflows/github/githubAgent.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from 'autonomys-agents-core/src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from 'autonomys-agents-core/src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from 'autonomys-agents-core/src/agents/workflows/orchestrator/types.js';
import { getConfig } from 'autonomys-agents-core/src/config/index.js';
import { createExperienceManager } from 'autonomys-agents-core/src/blockchain/agentExperience/index.js';
import { createLogger } from 'autonomys-agents-core/src/utils/logger.js';
import { parseArgs } from 'autonomys-agents-core/src/utils/args.js';

parseArgs();

const logger = createLogger('autonomous-web3-agent');

// Get the config instance
const configInstance = await getConfig();
const { config, agentVersion } = configInstance;

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  const dataPath = character.characterPath;

  const saveExperiences = config.autoDriveConfig.AUTO_DRIVE_SAVE_EXPERIENCES;
  const monitoringEnabled = config.autoDriveConfig.AUTO_DRIVE_MONITORING;
  const schedulerTools = createAllSchedulerTools();
  const experienceManager =
  (saveExperiences || monitoringEnabled) &&
  config.blockchainConfig.PRIVATE_KEY &&
  config.blockchainConfig.RPC_URL &&
  config.blockchainConfig.CONTRACT_ADDRESS &&
  config.autoDriveConfig.AUTO_DRIVE_API_KEY
    ? await createExperienceManager({
        autoDriveApiOptions: {
          apiKey: config.autoDriveConfig.AUTO_DRIVE_API_KEY,
          network: config.autoDriveConfig.AUTO_DRIVE_NETWORK,
        },
        uploadOptions: {
          compression: true,
          password: config.autoDriveConfig.AUTO_DRIVE_ENCRYPTION_PASSWORD,
        },
        walletOptions: {
          privateKey: config.blockchainConfig.PRIVATE_KEY,
          rpcUrl: config.blockchainConfig.RPC_URL,
          contractAddress: config.blockchainConfig.CONTRACT_ADDRESS,
        },
        agentOptions: {
          agentVersion: agentVersion,
          agentName: character.name,
          agentPath: character.characterPath,
        },
      })
    : undefined;
  const experienceConfig =
  saveExperiences && experienceManager
    ? {
        saveExperiences: true as const,
        experienceManager,
      }
    : {
        saveExperiences: false as const,
      };

const monitoringConfig =
  monitoringEnabled && experienceManager
    ? {
        enabled: true as const,
        monitoringExperienceManager: experienceManager,
      }
    : {
        enabled: false as const,
      };

  const githubToken = config.githubConfig.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN is required in the environment variables');
  }
  const githubAgentTools = githubToken
    ? [
        createGithubAgent(githubToken, GitHubToolsSubset.ISSUES_CONTRIBUTOR, character, {
          tools: [...schedulerTools],
          experienceConfig,
          monitoringConfig,
          characterDataPathConfig: {
            dataPath,
          },
        }),
      ]
    : [];

  //Orchestrator config
  //use default orchestrator prompts with character config
  const prompts = await createPrompts(character);

  return {
    tools: [...githubAgentTools],
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
    const humanMessage = new HumanMessage(initialMessage) as any;
    const result = await runner.runWorkflow({ messages: [humanMessage] });

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
