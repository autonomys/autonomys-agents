import { DynamicStructuredTool } from '@langchain/core/tools';
import { HumanMessage } from '@langchain/core/messages';
import { Character } from '../../../config/characters.js';
import { createOrchestratorRunner } from '../orchestrator/orchestratorWorkflow.js';
import { createSlackTools } from '../../tools/slack/index.js';
import { createSlackPrompts } from './prompts.js';
import { LLMConfiguration } from '../../../services/llm/types.js';
import { withApiLogger } from '../../../api/server.js';
import { createLogger } from '../../../utils/logger.js';
import { z } from 'zod';
import { SlackAgentConfig, SlackAgentOptions } from './types.js';
import { registerOrchestratorRunner } from '../registration.js';
import { cleanMessageData } from '../orchestrator/cleanMessages.js';
const logger = createLogger('slack-workflow');

const defaultModelConfig: LLMConfiguration = {
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-latest',
  temperature: 0.8,
};

const defaultOptions: SlackAgentConfig = {
  tools: [],
  modelConfigurations: {
    inputModelConfig: defaultModelConfig,
    messageSummaryModelConfig: defaultModelConfig,
    finishWorkflowModelConfig: defaultModelConfig,
  },
  saveExperiences: false,
  monitoring: {
    enabled: false,
    messageCleaner: cleanMessageData,
  },
  recursionLimit: 100,
};

const createSlackAgentConfig = (options?: SlackAgentOptions): SlackAgentConfig => {
  const modelConfigurations = {
    ...defaultOptions.modelConfigurations,
    ...options?.modelConfigurations,
  };
  const monitoring = {
    ...defaultOptions.monitoring,
    ...options?.monitoring,
  };

  return { ...defaultOptions, ...options, modelConfigurations, monitoring };
};

export const createSlackAgent = (
  slackToken: string,
  character: Character,
  options?: SlackAgentOptions,
) =>
  new DynamicStructuredTool({
    name: 'slack_agent',
    description: `
    With this tool you can perform all necessary actions you would like to do on slack.
    It is an agentic workflow that will execute many actions to meet your needs.
    Be specific about what you want to do.
    `,
    schema: z.object({ instructions: z.string().describe('Instructions for the workflow') }),
    func: async ({ instructions }: { instructions: string }) => {
      try {
        const { tools, modelConfigurations, saveExperiences, monitoring, recursionLimit } =
          createSlackAgentConfig(options);
        const messages = [new HumanMessage(instructions)];
        const namespace = 'slack';

        const prompts = await createSlackPrompts(character);
        const slackTools = await createSlackTools(slackToken);

        const runner = createOrchestratorRunner(character, {
          modelConfigurations,
          tools: [...slackTools, ...tools],
          prompts,
          namespace,
          saveExperiences,
          monitoring,
          recursionLimit,
          ...withApiLogger(namespace),
        });

        const runnerPromise = await runner;
        registerOrchestratorRunner(namespace, runnerPromise);
        const result = await runnerPromise.runWorkflow(
          { messages },
          { threadId: 'slack_workflow_state' },
        );
        logger.info('Slack workflow result:', { result });
        return result;
      } catch (error) {
        logger.error('Slack workflow error:', error);
        throw error;
      }
    },
  });
