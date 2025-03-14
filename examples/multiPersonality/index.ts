import { HumanMessage } from '@langchain/core/messages';
import { createWebSearchTool } from '../../src/agents/tools/webSearch/index.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '../../src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from '../../src/agents/workflows/orchestrator/prompts.js';
import { OrchestratorRunnerOptions } from '../../src/agents/workflows/orchestrator/types.js';
import { createTwitterAgent } from '../../src/agents/workflows/twitter/twitterAgent.js';
import { validateLocalHash } from '../../src/blockchain/localHashStorage.js';
import { Character } from '../../src/config/characters.js';
import { config } from '../../src/config/index.js';
import { createTwitterApi } from '../../src/services/twitter/client.js';
import { createLogger } from '../../src/utils/logger.js';
const logger = createLogger('autonomous-twitter-agent');

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
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  //shared twitter agent and orchestrator config
  const webSearchTool = config.SERPAPI_API_KEY ? [createWebSearchTool(config.SERPAPI_API_KEY)] : [];
  const saveExperiences = config.autoDriveConfig.AUTO_DRIVE_SAVE_EXPERIENCES;
  const monitoringEnabled = config.autoDriveConfig.AUTO_DRIVE_MONITORING;

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
              tools: [...webSearchTool],
              postTweets: config.twitterConfig.POST_TWEETS,
              saveExperiences,
              monitoring: {
                enabled: monitoringEnabled,
              },
              modelConfigurations: config.twitterConfig.model_configurations,
            },
          ),
        ]
      : [];

  //Orchestrator config
  //use default orchestrator prompts with a "responsible" character config specific for the orchestrator
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
    saveExperiences: saveExperiences,
    monitoring: {
      enabled: monitoringEnabled,
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
    await validateLocalHash();

    let message = initialMessage;
    while (true) {
      const result = await runner.runWorkflow({ messages: [new HumanMessage(message)] });

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
