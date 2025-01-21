import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { createLogger } from '../../../utils/logger.js';
import { LLMFactory } from '../../../services/llm/factory.js';
import { config } from '../../../config/index.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { createTools } from './tools.js';
import { createNodes } from './nodes.js';
import { OrchestratorConfig, OrchestratorInput, OrchestratorState } from './types.js';
import { HumanMessage } from '@langchain/core/messages';

const logger = createLogger('orchestrator-workflow');

export const createWorkflowConfig = async (): Promise<OrchestratorConfig> => {
  const { tools } = createTools();
  const toolNode = new ToolNode(tools);
  const orchestratorModel = LLMFactory.createModel(config.llmConfig.nodes.orchestrator);
  const boundModel = orchestratorModel.bindTools(tools);
  return { orchestratorModelWithTools: boundModel, toolNode };
};

const createOrchestratorWorkflow = async (nodes: Awaited<ReturnType<typeof createNodes>>) => {
  const workflow = new StateGraph(OrchestratorState)
    .addNode('input', nodes.inputNode)
    .addNode('tools', nodes.toolNode)
    .addEdge(START, 'input')
    .addEdge('input', 'tools')
    .addEdge('tools', END);

  return workflow;
};

type OrchestratorRunner = Readonly<{
  runWorkflow: (input?: OrchestratorInput) => Promise<unknown>;
}>;

const createOrchestratorRunner = async (): Promise<OrchestratorRunner> => {
  const workflowConfig = await createWorkflowConfig();
  const nodes = await createNodes(workflowConfig);
  const workflow = await createOrchestratorWorkflow(nodes);
  const memoryStore = new MemorySaver();
  const app = workflow.compile({ checkpointer: memoryStore });

  return {
    runWorkflow: async (input?: OrchestratorInput) => {
      const threadId = 'orchestrator_workflow_state';
      logger.info('Starting orchestrator workflow', { threadId });

      const config = {
        recursionLimit: 50,
        configurable: {
          thread_id: threadId,
        },
      };

      const initialState = input || { messages: [] };
      const stream = await app.stream(initialState, config);
      let finalState = {};

      for await (const state of stream) {
        finalState = state;
      }

      logger.info('Workflow completed', { threadId });

      return finalState;
    },
  };
};

// Create workflow runner with caching
export const getOrchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | null = null;

  return () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner();
    }
    return runnerPromise;
  };
})();

export const runOrchestratorWorkflow = async (input?: string) => {
  const messages = [new HumanMessage(input || '')];
  const runner = await getOrchestratorRunner();
  return runner.runWorkflow({ messages });
};
