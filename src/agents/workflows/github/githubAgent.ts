import { HumanMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { withApiLogger } from '../../../api/server.js';
import { Character } from '../../../config/characters.js';
import { LLMConfiguration } from '../../../services/llm/types.js';
import { createLogger } from '../../../utils/logger.js';
import { createGitHubTools, GitHubToolsSubset } from '../../tools/github/index.js';
import { cleanMessageData } from '../orchestrator/cleanMessages.js';
import { createOrchestratorRunner } from '../orchestrator/orchestratorWorkflow.js';
import { registerOrchestratorRunner } from '../registration.js';
import { createGithubPrompts } from './prompts.js';
import { GithubAgentConfig, GithubAgentOptions } from './types.js';

const logger = createLogger('github-workflow');

const defaultModelConfig: LLMConfiguration = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-latest',
  temperature: 0.8,
};

const defaultOptions: GithubAgentConfig = {
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

const createGithubAgentConfig = (options?: GithubAgentOptions): GithubAgentConfig => {
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

export const createGithubAgent = (
  githubToken: string,
  subset: GitHubToolsSubset,
  character: Character,
  options?: GithubAgentOptions,
) =>
  new DynamicStructuredTool({
    name: 'github_agent',
    description: `
    With this tool you can perform all necessary actions you would like to do on github.
    It is an agentic workflow that will execute many actions to meet your needs.
    Be specific about what you want to do.
    `,
    schema: z.object({ instructions: z.string().describe('Instructions for the workflow') }),
    func: async ({ instructions }: { instructions: string }) => {
      try {
        const { tools, modelConfigurations, saveExperiences, monitoring, recursionLimit } =
          createGithubAgentConfig(options);
        const messages = [new HumanMessage(instructions)];
        const namespace = 'github';

        const prompts = await createGithubPrompts(character);
        const githubTools = await createGitHubTools(githubToken, subset);

        const runner = createOrchestratorRunner(character, {
          modelConfigurations,
          tools: [...githubTools, ...tools],
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
          { threadId: 'github_workflow_state' },
        );
        logger.info('Github workflow result:', { result });
        return result;
      } catch (error) {
        logger.error('Github workflow error:', error);
        throw error;
      }
    },
  });
