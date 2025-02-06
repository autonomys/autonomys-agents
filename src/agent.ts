import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from './agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createTools } from './agents/workflows/orchestrator/tools.js';
import { createTwitterAgentTool } from './agents/workflows/twitter/twitterAgentTool.js';
import { config } from './config/index.js';
import { createTwitterApi } from './services/twitter/client.js';
import { createPrompts } from './agents/workflows/orchestrator/prompts.js';
import { LLMNodeConfiguration, LLMProvider } from './services/llm/types.js';
import { PruningParameters } from './agents/workflows/orchestrator/types.js';
import { VectorDB } from './services/vectorDb/VectorDB.js';
import { join } from 'path';

const orchestatorConfig = async () => {
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const twitterAgent = createTwitterAgentTool(twitterApi);
  const namespace = 'orchestrator';
  const vectorStore = new VectorDB(
    join('data', namespace),
    `${namespace}-index.bin`,
    `${namespace}-store.db`,
    100000,
  );
  const { tools } = createTools();
  const prompts = await createPrompts();
  const pruningParameters: PruningParameters = {
    maxWindowSummary: 30,
    maxQueueSize: 50,
  };
  const model: LLMNodeConfiguration = {
    provider: LLMProvider.ANTHROPIC,
    model: 'claude-3-5-sonnet-latest',
    temperature: 0,
  };

  return { model, namespace, tools: [...tools, twitterAgent], prompts, pruningParameters, vectorStore };
};

const orchestratorConfig = await orchestatorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(
        orchestratorConfig.model,
        orchestratorConfig.tools,
        orchestratorConfig.prompts,
        orchestratorConfig.namespace,
        orchestratorConfig.vectorStore,
        orchestratorConfig.pruningParameters,
      );
    }
    return runnerPromise;
  };
})();
