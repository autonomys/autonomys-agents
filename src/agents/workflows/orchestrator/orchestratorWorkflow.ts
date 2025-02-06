import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { createLogger } from '../../../utils/logger.js';
import { LLMFactory } from '../../../services/llm/factory.js';
import { config } from '../../../config/index.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { createNodes } from './nodes.js';
import {
  OrchestratorConfig,
  OrchestratorInput,
  OrchestratorPrompts,
  OrchestratorState,
} from './types.js';
import { StructuredToolInterface } from '@langchain/core/tools';
import { RunnableToolLike } from '@langchain/core/runnables';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { join } from 'path';
const logger = createLogger('orchestrator-workflow');

const createWorkflowConfig = async (
  tools: (StructuredToolInterface | RunnableToolLike)[],
  prompts: OrchestratorPrompts,
): Promise<OrchestratorConfig> => {
  const toolNode = new ToolNode(tools);
  const orchestratorModel = LLMFactory.createModel(config.llmConfig.nodes.orchestrator);
  return { orchestratorModel, toolNode, prompts };
};

const handleConditionalEdge = async (state: typeof OrchestratorState.State) => {
  logger.debug('State in conditional edge', { state });

  if (state.workflowControl && state.workflowControl.shouldStop) {
    logger.info('Workflow stop requested', { reason: state.workflowControl.reason });
    return 'finishWorkflow';
  }

  return 'tools';
};

const createOrchestratorWorkflow = async (nodes: Awaited<ReturnType<typeof createNodes>>) => {
  const workflow = new StateGraph(OrchestratorState)
    .addNode('input', nodes.inputNode)
    .addNode('messageSummary', nodes.messageSummaryNode)
    .addNode('finishWorkflow', nodes.finishWorkflowNode)
    .addNode('tools', nodes.toolNode)
    .addEdge(START, 'input')
    .addConditionalEdges('input', handleConditionalEdge)
    .addEdge('tools', 'messageSummary')
    .addEdge('messageSummary', 'input')
    .addEdge('finishWorkflow', END);

  return workflow;
};

export type OrchestratorRunner = Readonly<{
  runWorkflow: (input?: OrchestratorInput, options?: { threadId?: string }) => Promise<unknown>;
}>;

export const createOrchestratorRunner = async (
  tools: (StructuredToolInterface | RunnableToolLike)[],
  prompts: OrchestratorPrompts,
  namespace: string,
): Promise<OrchestratorRunner> => {
  const workflowConfig = await createWorkflowConfig(tools, prompts);

  const vectorStore = new VectorDB(
    join('data', namespace),
    `${namespace}-index.bin`,
    `${namespace}-store.db`,
    100000,
  );

  const nodes = await createNodes(workflowConfig, vectorStore);
  const workflow = await createOrchestratorWorkflow(nodes);
  const memoryStore = new MemorySaver();
  const app = workflow.compile({ checkpointer: memoryStore });

  return {
    runWorkflow: async (input?: OrchestratorInput, options?: { threadId?: string }) => {
      const threadId = options?.threadId || 'orchestrator_workflow_state';
      logger.info('Starting orchestrator workflow', { threadId });

      if (!vectorStore.isOpen()) {
        logger.info('Opening vector store connection for new workflow run');
        await vectorStore.open();
      }

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
      vectorStore.close();
      return finalState;
    },
  };
};

export const getOrchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return ({
    prompts,
    tools,
    namespace,
  }: {
    prompts: OrchestratorPrompts;
    tools: (StructuredToolInterface | RunnableToolLike)[];
    namespace: string;
  }) => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(tools, prompts, namespace);
    }
    return runnerPromise;
  };
})();
