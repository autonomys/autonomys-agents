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
import { FinishedWorkflow } from './nodes/finishWorkflowPrompt.js';
import { parseFinishedWorkflow } from './nodes/finishWorkflowNode.js';
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
  runWorkflow: (
    input?: OrchestratorInput,
    options?: { threadId?: string },
  ) => Promise<FinishedWorkflow>;
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
    runWorkflow: async (
      input?: OrchestratorInput,
      options?: { threadId?: string },
    ): Promise<FinishedWorkflow> => {
      const threadId = `${options?.threadId || 'orchestrator'}-${Date.now()}`;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let finalState = {} as any;

      for await (const state of stream) {
        finalState = state;
      }

      logger.info('Workflow completed', {
        threadId,
      });

      if (finalState?.finishWorkflow?.messages?.[0]?.content) {
        const workflowData = await parseFinishedWorkflow(
          finalState.finishWorkflow.messages[0].content,
        );

        const workflowSummary = `Previous workflow summary finished running at ${new Date().toISOString()}. Workflow summary: ${workflowData.workflowSummary}`;
        const nextWorkflowPrompt =
          workflowData.nextWorkflowPrompt &&
          `Instructions for this workflow: ${workflowData.nextWorkflowPrompt}`;

        return { ...workflowData, workflowSummary, nextWorkflowPrompt };
      } else {
        logger.error('Workflow completed but no finished workflow data found', {
          finalState,
          content: finalState?.finishWorkflow?.content,
        });
        return { workflowSummary: 'Extracting workflow data failed' };
      }
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
