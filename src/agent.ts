import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from './agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from './agents/workflows/orchestrator/prompts.js';
import { createTools } from './agents/workflows/orchestrator/tools.js';
import { createTwitterAgentTool } from './agents/workflows/twitter/twitterAgentTool.js';
import { config } from './config/index.js';
import { createTwitterApi } from './services/twitter/client.js';

const orchestatorConfig = async () => {
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const twitterAgent = createTwitterAgentTool(twitterApi);
  const namespace = 'orchestrator';
  const { tools } = createTools();
  const orchestratorPrompts = await createPrompts();
  return {
    prompts: orchestratorPrompts,
    tools: [...tools, twitterAgent],
    namespace,
  };
};

const orchestratorConfig = await orchestatorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(
        orchestratorConfig.tools,
        orchestratorConfig.prompts,
        orchestratorConfig.namespace,
      );
    }
    return runnerPromise;
  };
})();
