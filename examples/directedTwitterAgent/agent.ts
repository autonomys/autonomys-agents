import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '../../src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createTools } from '../../src/agents/workflows/orchestrator/tools.js';
import { createDirectedTwitterAgentTool } from '../../src/agents/workflows/directedTwitter/directedTwitterAgentTool.js';
import { createPrompts } from '../../src/agents/workflows/orchestrator/prompts.js';
import { LLMProvider } from '../../src/services/llm/types.js';
import { PruningParameters } from '../../src/agents/workflows/orchestrator/types.js';
import { LLMFactory } from '../../src/services/llm/factory.js';

const orchestatorConfig = async () => {
  const directedTwitterAgent = createDirectedTwitterAgentTool();
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
    tools: [...tools, directedTwitterAgent],
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
