import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from './agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createTools } from './agents/workflows/orchestrator/tools.js';
import { createTwitterAgentTool } from './agents/workflows/twitter/twitterAgentTool.js';
import { config } from './config/index.js';
import { createTwitterApi } from './services/twitter/client.js';
import { createPrompts } from './agents/workflows/orchestrator/prompts.js';
import { LLMProvider } from './services/llm/types.js';
import { PruningParameters } from './agents/workflows/orchestrator/types.js';
import { LLMFactory } from './services/llm/factory.js';
import { createWebSearchTool } from './agents/tools/webSearchTool.js';
import { VectorDB } from './services/vectorDb/VectorDB.js';
import { createVectorDbSearchTool } from './agents/tools/vectorDbTools.js';

const orchestratorConfig = async () => {
  //Twitter agent config
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const webSearchTool = createWebSearchTool();
  const twitterAgent = createTwitterAgentTool(twitterApi, [webSearchTool]);

  //Orchestrator config
  const namespace = 'orchestrator';
  const tools = createTools();
  const prompts = await createPrompts({ selfSchedule: true });
  const pruningParameters: PruningParameters = {
    maxWindowSummary: 30,
    maxQueueSize: 50,
  };
  const model = LLMFactory.createModel({
    provider: LLMProvider.ANTHROPIC,
    model: 'claude-3-5-sonnet-latest',
    temperature: 0.8,
  });
  const orchestratorVectorStore = new VectorDB(namespace);
  const orchestratorVectorDbSearchTool = createVectorDbSearchTool(orchestratorVectorStore);
  return {
    model,
    namespace,
    tools: [...tools, twitterAgent, webSearchTool, orchestratorVectorDbSearchTool],
    prompts,
    pruningParameters,
    vectorStore: orchestratorVectorStore,
  };
};

const orchestrationConfig = await orchestratorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(
        orchestrationConfig.model,
        orchestrationConfig.tools,
        orchestrationConfig.prompts,
        orchestrationConfig.namespace,
        orchestrationConfig.pruningParameters,
      );
    }
    return runnerPromise;
  };
})();
