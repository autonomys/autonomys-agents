import { HumanMessage } from '@langchain/core/messages';
import { createWebSearchTool } from 'autonomys-agents-core/src/agents/tools/webSearch/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from 'autonomys-agents-core/src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from 'autonomys-agents-core/src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from 'autonomys-agents-core/src/agents/workflows/orchestrator/types.js';
import { createTwitterAgent } from 'autonomys-agents-core/src/agents/workflows/twitter/twitterAgent.js';
import { getConfig } from 'autonomys-agents-core/src/config/index.js';
import { Character } from 'autonomys-agents-core/src/config/types.js';
import { createTwitterApi } from 'autonomys-agents-core/src/agents/tools/twitter/client.js';
import { createLogger } from 'autonomys-agents-core/src/utils/logger.js';
import { createAllSchedulerTools } from 'autonomys-agents-core/src/agents/tools/scheduler/index.js';
import { createExperienceManager } from 'autonomys-agents-core/src/blockchain/agentExperience/index.js';
import { parseArgs } from 'autonomys-agents-core/src/utils/args.js';

parseArgs();

const logger = createLogger('autonomous-twitter-agent');

// Get the config instance
const configInstance = await getConfig();
const { config, agentVersion } = configInstance;

const twitterCharacter = config.characterConfig;
const orchestratorCharacter: Character = {
  name: 'Responsible Agent',
  characterPath: twitterCharacter.characterPath,
  goal: 'Schedule and execute workflows, making sure to keep any sub-agents on track',
  personality: ['Responsible', 'Persuasive', 'Organized'],
  expertise: ['Workflow scheduling', 'Task prioritization', 'Error handling'],
  communicationRules: {
    rules: [],
    wordsToAvoid: [],
  },
};
const character = config.characterConfig;

const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  //shared twitter agent and orchestrator config
  const dataPath = character.characterPath;

  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];
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
          agentName: orchestratorCharacter.name,
          agentPath: orchestratorCharacter.characterPath,
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

  //Twitter agent config
  const twitterAgentTool =
    config.twitterConfig.USERNAME && config.twitterConfig.PASSWORD
      ? [
          createTwitterAgent(
            await createTwitterApi(
              config.twitterConfig.USERNAME,
              config.twitterConfig.PASSWORD,
              config.twitterConfig.COOKIES_PATH,
            ),
            twitterCharacter,
            {
              tools: [...webSearchTool, ...schedulerTools],
              postTweets: config.twitterConfig.POST_TWEETS,
              experienceConfig,
              monitoringConfig,
              modelConfigurations: config.twitterConfig.model_configurations,
              characterDataPathConfig: {
                dataPath,
              },
            },
          ),
        ]
      : [];

  //Orchestrator config
  //use default orchestrator prompts with character config from CLI
  const prompts = await createPrompts(orchestratorCharacter);

  //override default model configurations for summary and finish workflow nodes
  const modelConfigurations = {
    messageSummaryModelConfig: {
      provider: 'openai' as const,
      model: 'gpt-4o',
      temperature: 0.8,
    },
    finishWorkflowModelConfig: {
      provider: 'openai' as const,
      model: 'gpt-4o-mini',
      temperature: 0.8,
    },
  };
  return {
    modelConfigurations,
    tools: [...twitterAgentTool, ...webSearchTool],
    prompts,
    experienceConfig:
      saveExperiences && experienceManager
        ? { saveExperiences: true, experienceManager }
        : { saveExperiences: false },
    monitoringConfig:
      monitoringEnabled && experienceManager
        ? {
            enabled: true,
            monitoringExperienceManager: experienceManager,
          }
        : {
            enabled: false,
          },
    characterDataPathConfig: {
      dataPath,
    },
  };
};

const orchestrationConfig = await orchestratorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(twitterCharacter, orchestrationConfig);
    }
    return runnerPromise;
  };
})();

const main = async () => {
  const runner = await orchestratorRunner();
  const initialMessage = `Check your timeline, engage with posts and find an interesting topic to tweet about.`;
  try {
    let message = initialMessage;
    while (true) {
      const humanMessage = new HumanMessage(message) as any;
      const result = await runner.runWorkflow({ messages: [humanMessage] });

      message = `${result.summary}`;

      logger.info('Workflow execution result:', { result });

      const nextDelaySeconds = 3600;
      logger.info('Workflow execution completed successfully for character:', {
        characterName: config.characterConfig.name,
        runFinished: new Date().toISOString(),
        nextRun: `${nextDelaySeconds / 60} minutes`,
        nextWorkflowPrompt: message,
      });
      await new Promise(resolve => setTimeout(resolve, nextDelaySeconds * 1000));
    }
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
