import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { createLogger } from '../../../utils/logger.js';
import { LLMModelType } from '../../../services/llm/factory.js';
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
import { config } from '../../../config/index.js';

const logger = createLogger('orchestrator-workflow');

const createWorkflowConfig = (
  orchestratorModel: LLMModelType,
  tools: (StructuredToolInterface | RunnableToolLike)[],
  prompts: OrchestratorPrompts,
  namespace: string,
  pruningParameters?: PruningParameters,
  vectorStore?: VectorDB,
): OrchestratorConfig => {
  const toolNode = new ToolNode(tools);
  if (!pruningParameters) {
    pruningParameters = {
      maxWindowSummary: config.orchestratorConfig.MAX_WINDOW_SUMMARY,
      maxQueueSize: config.orchestratorConfig.MAX_QUEUE_SIZE,
    };
  }
  if (!vectorStore) {
    vectorStore = new VectorDB(namespace);
  }

  return { orchestratorModel, toolNode, prompts, pruningParameters, namespace, vectorStore };
};

const handleConditionalEdge = async (state: OrchestratorStateType) => {
  logger.debug('State in conditional edge', { state });

  if (state.workflowControl && state.workflowControl.shouldStop) {
    logger.info('Workflow stop requested', { reason: state.workflowControl.reason });
    return 'finishWorkflow';
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
  model: LLMModelType,
  tools: (StructuredToolInterface | RunnableToolLike)[],
  prompts: OrchestratorPrompts,
  namespace: string,
  pruningParameters?: PruningParameters,
  vectorStore?: VectorDB,
): Promise<OrchestratorRunner> => {
  const workflowConfig = createWorkflowConfig(
    model,
    tools,
    prompts,
    namespace,
    pruningParameters,
    vectorStore,
  );

  const nodes = await createNodes(workflowConfig);
  const workflow = await createOrchestratorWorkflow(nodes, workflowConfig.pruningParameters);
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
      workflowConfig.vectorStore.close();
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
    vectorStore,
    pruningParameters,
  }: {
    model: LLMModelType;
    prompts: OrchestratorPrompts;
    tools: (StructuredToolInterface | RunnableToolLike)[];
    namespace: string;
    vectorStore: VectorDB;
    pruningParameters?: PruningParameters;
  }) => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(
        model,
        tools,
        prompts,
        namespace,
        pruningParameters,
        vectorStore,
      );
    }
    return runnerPromise;
  };
})();
