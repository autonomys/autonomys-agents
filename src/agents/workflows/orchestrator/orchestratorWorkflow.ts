import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { createLogger } from '../../../utils/logger.js';
import { createNodes } from './nodes.js';
import {
  OrchestratorConfig,
  OrchestratorInput,
  OrchestratorRunnerOptions,
  OrchestratorStateType,
  PruningParameters,
} from './types.js';
import { OrchestratorState } from './state.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { FinishedWorkflow } from './nodes/finishWorkflowPrompt.js';
import { parseFinishedWorkflow } from './nodes/finishWorkflowNode.js';
import { LLMConfiguration, LLMProvider } from '../../../services/llm/types.js';
import { createPrompts } from './prompts.js';
import { createDefaultOrchestratorTools } from './tools.js';
import { Character } from '../../../config/characters.js';

const logger = createLogger('orchestrator-workflow');

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

const defaultModelConfiguration: LLMConfiguration = {
  provider: LLMProvider.ANTHROPIC,
  model: 'claude-3-5-sonnet-latest',
  temperature: 0.8,
};

const defaultOptions = {
  modelConfigurations: {
    inputModelConfig: defaultModelConfiguration,
    messageSummaryModelConfig: defaultModelConfiguration,
    finishWorkflowModelConfig: defaultModelConfiguration,
  },
  namespace: 'orchestrator',
  pruningParameters: {
    maxWindowSummary: 30,
    maxQueueSize: 50,
  },
  autoDriveUploadEnabled: false,
};

const createOrchestratorRunnerConfig = async (
  character: Character,
  options?: OrchestratorRunnerOptions,
): Promise<OrchestratorConfig> => {
  const mergedOptions = { ...defaultOptions, ...options };

  const modelConfigurations = {
    ...defaultOptions.modelConfigurations,
    ...options?.modelConfigurations,
  };
  const vectorStore = options?.vectorStore || new VectorDB(defaultOptions.namespace);
  const tools = [
    ...(options?.tools || []),
    ...createDefaultOrchestratorTools(vectorStore, mergedOptions.autoDriveUploadEnabled),
  ];
  const prompts = options?.prompts || (await createPrompts(character));
  return {
    ...mergedOptions,
    vectorStore,
    tools,
    modelConfigurations,
    prompts,
  };
};

export const createOrchestratorRunner = async (
  character: Character,
  options?: OrchestratorRunnerOptions,
): Promise<OrchestratorRunner> => {
  const runnerOptions = await createOrchestratorRunnerConfig(character, options);

  const nodes = await createNodes(runnerOptions);
  const workflow = await createOrchestratorWorkflow(nodes, runnerOptions.pruningParameters);
  logger.info('prompts', {
    inputPrompt: runnerOptions.prompts?.inputPrompt,
    messageSummaryPrompt: runnerOptions.prompts?.messageSummaryPrompt,
    finishWorkflowPrompt: runnerOptions.prompts?.finishWorkflowPrompt,
  });

  const memoryStore = new MemorySaver();
  const app = workflow.compile({ checkpointer: memoryStore });

  return {
    runWorkflow: async (
      input?: OrchestratorInput,
      options?: { threadId?: string },
    ): Promise<FinishedWorkflow> => {
      const threadId = `${options?.threadId || 'orchestrator'}-${Date.now()}`;
      logger.info('Starting orchestrator workflow', { threadId });

      if (!runnerOptions.vectorStore.isOpen()) {
        await runnerOptions.vectorStore.open();
      }

      const config = {
        recursionLimit: 50,
        configurable: {
          ...runnerOptions.pruningParameters,
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

        const summary = `This action finished running at ${new Date().toISOString()}. Action summary: ${workflowData.summary}`;
        const nextWorkflowPrompt =
          workflowData.nextWorkflowPrompt &&
          `Instructions for this workflow: ${workflowData.nextWorkflowPrompt}`;
        runnerOptions.vectorStore.close();
        return { ...workflowData, summary, nextWorkflowPrompt };
      } else {
        logger.error('Workflow completed but no finished workflow data found', {
          finalState,
          content: finalState?.finishWorkflow?.content,
        });
        runnerOptions.vectorStore.close();
        return { summary: 'Extracting workflow data failed' };
      }
    },
  };
};

export const getOrchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return (character: Character, runnerOptions: OrchestratorRunnerOptions) => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(character, runnerOptions);
    }
    return runnerPromise;
  };
})();
