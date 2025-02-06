import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { createLogger } from '../../../utils/logger.js';
import { LLMFactory } from '../../../services/llm/factory.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { createNodes } from './nodes.js';
import {
  OrchestratorConfig,
  OrchestratorInput,
  OrchestratorPrompts,
  OrchestratorStateType,
  PruningParameters,
} from './types.js';
import { OrchestratorState } from './state.js';
import { StructuredToolInterface } from '@langchain/core/tools';
import { RunnableToolLike } from '@langchain/core/runnables';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { join } from 'path';
import { LLMNodeConfiguration } from '../../../services/llm/types.js';
import { config } from '../../../config/index.js';

const logger = createLogger('orchestrator-workflow');

const createWorkflowConfig = async (
  model: LLMNodeConfiguration,
  tools: (StructuredToolInterface | RunnableToolLike)[],
  prompts: OrchestratorPrompts,
  pruningParameters?: PruningParameters,
): Promise<OrchestratorConfig> => {
  const toolNode = new ToolNode(tools);
  const orchestratorModel = LLMFactory.createModel(model).bind({
    tools,
  });
  if (pruningParameters === undefined) {
    pruningParameters = {
      maxWindowSummary: config.orchestratorConfig.MAX_WINDOW_SUMMARY,
      maxQueueSize: config.orchestratorConfig.MAX_QUEUE_SIZE,
    };
  }
  return { orchestratorModel, toolNode, prompts, pruningParameters };
};

const handleConditionalEdge = async (state: OrchestratorStateType) => {
  logger.debug('State in conditional edge', { state });

  if (state.workflowControl && state.workflowControl.shouldStop) {
    logger.info('Workflow stop requested', { reason: state.workflowControl.reason });
    return 'workflowSummary';
  }

  return 'tools';
};

const createOrchestratorWorkflow = async (
  nodes: Awaited<ReturnType<typeof createNodes>>,
  pruningParameters: PruningParameters,
) => {
  const workflow = new StateGraph(OrchestratorState(pruningParameters))
    .addNode('input', nodes.inputNode)
    .addNode('messageSummary', nodes.messageSummaryNode)
    .addNode('workflowSummary', nodes.workflowSummaryNode)
    .addNode('tools', nodes.toolNode)
    .addEdge(START, 'input')
    .addConditionalEdges('input', handleConditionalEdge)
    .addEdge('tools', 'messageSummary')
    .addEdge('messageSummary', 'input')
    .addEdge('workflowSummary', END);

  return workflow;
};

export type OrchestratorRunner = Readonly<{
  runWorkflow: (input?: OrchestratorInput, options?: { threadId?: string }) => Promise<unknown>;
}>;

export const createOrchestratorRunner = async (
  model: LLMNodeConfiguration,
  tools: (StructuredToolInterface | RunnableToolLike)[],
  prompts: OrchestratorPrompts,
  namespace: string,
  pruningParameters?: PruningParameters,
): Promise<OrchestratorRunner> => {
  const workflowConfig = await createWorkflowConfig(model, tools, prompts, pruningParameters);

  const vectorStore = new VectorDB(
    join('data', namespace),
    `${namespace}-index.bin`,
    `${namespace}-store.db`,
    100000,
  );

  const nodes = await createNodes(workflowConfig, vectorStore);
  const workflow = await createOrchestratorWorkflow(nodes, workflowConfig.pruningParameters);
  const memoryStore = new MemorySaver();
  const app = workflow.compile({ checkpointer: memoryStore });

  return {
    runWorkflow: async (input?: OrchestratorInput, options?: { threadId?: string }) => {
      const threadId = options?.threadId || 'orchestrator_workflow_state';
      logger.info('Starting orchestrator workflow', { threadId });

      const config = {
        recursionLimit: 50,
        configurable: {
          ...workflowConfig.pruningParameters,
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
      vectorStore.close();
      return finalState;
    },
  };
};

export const getOrchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return ({
    model,
    prompts,
    tools,
    namespace,
    pruningParameters,
  }: {
    model: LLMNodeConfiguration;
    prompts: OrchestratorPrompts;
    tools: (StructuredToolInterface | RunnableToolLike)[];
    namespace: string;
    pruningParameters?: PruningParameters;
  }) => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(model, tools, prompts, namespace, pruningParameters);
    }
    return runnerPromise;
  };
})();
