import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '../../src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createTools } from '../../src/agents/workflows/orchestrator/tools.js';
import { createTwitterAgentTool } from '../../src/agents/workflows/twitter/twitterAgentTool.js';
import { createPrompts } from '../../src/agents/workflows/orchestrator/prompts.js';
import { LLMProvider } from '../../src/services/llm/types.js';
import { PruningParameters } from '../../src/agents/workflows/orchestrator/types.js';
import { LLMFactory } from '../../src/services/llm/factory.js';
import { createTwitterApi } from '../../src/services/twitter/client.js';
import { config } from '../../src/config/index.js';

const orchestatorConfig = async () => {
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const twitterAgent = createTwitterAgentTool(twitterApi);
  const namespace = 'orchestrator';
  const { tools } = createTools();
  const prompts = await createPrompts({ selfSchedule: true });
  const pruningParameters: PruningParameters = {
    maxWindowSummary: 30,
    maxQueueSize: 50,
  };
  const model = LLMFactory.createModel({
    provider: LLMProvider.ANTHROPIC,
    model: 'claude-3-5-sonnet-latest',
    temperature: 0,
  });
  return {
    model,
    namespace,
    tools: [...tools, twitterAgent],
    prompts,
    pruningParameters,
  };
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
        orchestratorConfig.pruningParameters,
      );
    }
    return runnerPromise;
  };
})();
