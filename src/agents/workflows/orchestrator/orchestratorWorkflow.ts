import { BaseMessage } from '@langchain/core/messages';
import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { uploadToDsn } from '../../../blockchain/autoDrive/autoDriveUpload.js';
import { Character } from '../../../config/characters.js';
import { LLMConfiguration } from '../../../services/llm/types.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';
import { createLogger } from '../../../utils/logger.js';
import { cleanMessageData } from './cleanMessages.js';
import { createNodes } from './nodes.js';
import { parseFinishedWorkflow } from './nodes/finishWorkflowNode.js';
import { FinishedWorkflow } from './nodes/finishWorkflowPrompt.js';
import { createPrompts } from './prompts.js';
import { OrchestratorState } from './state.js';
import { createDefaultOrchestratorTools } from './tools.js';
import {
  OrchestratorConfig,
  OrchestratorInput,
  OrchestratorRunnerOptions,
  OrchestratorStateType,
  PruningParameters,
} from './types.js';
const logger = createLogger('orchestrator-workflow');

const handleConditionalEdge = async (
  state: OrchestratorStateType,
  pruningParameters: PruningParameters,
) => {
  logger.debug('State in conditional edge', { state });

  if (state.workflowControl && state.workflowControl.shouldStop) {
    logger.info('Workflow stop requested', { reason: state.workflowControl.reason });
    return 'finishWorkflow';
  }

  if (state.toolCalls && state.toolCalls.length > 0) {
    return 'toolExecution';
  }

  // Check if we need to summarize messages based on pruning parameters
  if (state.messages.length > pruningParameters.maxQueueSize) {
    logger.info('Messages exceed maxQueueSize, triggering summary', {
      messageCount: state.messages.length,
      maxQueueSize: pruningParameters.maxQueueSize,
    });
    return 'messageSummary';
  }

  // Skip message summary if not needed
  logger.info('Not summarizing, not enough messages', {
    messageCount: state.messages.length,
    maxQueueSize: pruningParameters.maxQueueSize,
  });
  return 'input';
};

const createOrchestratorWorkflow = async (
  nodes: Awaited<ReturnType<typeof createNodes>>,
  pruningParameters: PruningParameters,
) => {
  const workflow = new StateGraph(OrchestratorState(pruningParameters))
    .addNode('input', nodes.inputNode)
    .addNode('messageSummary', nodes.messageSummaryNode)
    .addNode('finishWorkflow', nodes.finishWorkflowNode)
    .addNode('toolExecution', nodes.toolExecutionNode)
    .addEdge(START, 'input')
    .addConditionalEdges('input', state => handleConditionalEdge(state, pruningParameters))
    .addEdge('toolExecution', 'input')
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
  provider: 'anthropic',
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
  saveExperiences: false,
  monitoring: {
    enabled: false,
    messageCleaner: cleanMessageData,
  },
  recursionLimit: 50,
};

const createOrchestratorRunnerConfig = async (
  character: Character,
  options?: OrchestratorRunnerOptions,
): Promise<OrchestratorConfig> => {
  const mergedOptions = { ...defaultOptions, ...options };

  const modelConfigurations = {
    inputModelConfig:
      options?.modelConfigurations?.inputModelConfig ||
      defaultOptions.modelConfigurations.inputModelConfig,
    messageSummaryModelConfig:
      options?.modelConfigurations?.messageSummaryModelConfig ||
      defaultOptions.modelConfigurations.messageSummaryModelConfig,
    finishWorkflowModelConfig:
      options?.modelConfigurations?.finishWorkflowModelConfig ||
      defaultOptions.modelConfigurations.finishWorkflowModelConfig,
  };

  const vectorStore = options?.vectorStore || new VectorDB(defaultOptions.namespace);
  const tools = [
    ...(options?.tools || []),
    ...createDefaultOrchestratorTools(vectorStore, mergedOptions.saveExperiences),
  ];
  const prompts = options?.prompts || (await createPrompts(character));
  const monitoring = {
    ...defaultOptions.monitoring,
    ...options?.monitoring,
  };
  return {
    ...mergedOptions,
    vectorStore,
    tools,
    modelConfigurations,
    prompts,
    monitoring,
  };
};

export const createOrchestratorRunner = async (
  character: Character,
  options?: OrchestratorRunnerOptions,
): Promise<OrchestratorRunner> => {
  const runnerConfig = await createOrchestratorRunnerConfig(character, options);

  const nodes = await createNodes(runnerConfig);
  const workflow = await createOrchestratorWorkflow(nodes, runnerConfig.pruningParameters);

  const memoryStore = new MemorySaver();
  const app = workflow.compile({ checkpointer: memoryStore });

  return {
    runWorkflow: async (
      input?: OrchestratorInput,
      options?: { threadId?: string },
    ): Promise<FinishedWorkflow> => {
      const threadId = `${options?.threadId || 'orchestrator'}-${Date.now()}`;
      logger.info('Starting orchestrator workflow', { threadId });

      if (!runnerConfig.vectorStore.isOpen()) {
        await runnerConfig.vectorStore.open();
      }

      const config = {
        recursionLimit: runnerConfig.recursionLimit,
        configurable: {
          ...runnerConfig.pruningParameters,
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

      if (runnerConfig.monitoring.enabled) {
        const rawMessages: BaseMessage[] | undefined = (await memoryStore.getTuple(config))
          ?.checkpoint.channel_values.messages as BaseMessage[];

        const cleanedMessages = runnerConfig.monitoring.messageCleaner?.(rawMessages);

        const dsnUpload = await uploadToDsn({
          messages: cleanedMessages,
          namespace: runnerConfig.namespace,
          type: 'monitoring',
        });
        logger.info('Dsn upload', { dsnUpload });
      }

      if (finalState?.finishWorkflow?.messages?.[0]?.content) {
        const workflowData = await parseFinishedWorkflow(
          finalState.finishWorkflow.messages[0].content,
        );

        const summary = `This action finished running at ${new Date().toISOString()}. Action summary: ${workflowData.summary}`;
        const nextWorkflowPrompt =
          workflowData.nextWorkflowPrompt &&
          `Instructions for this workflow: ${workflowData.nextWorkflowPrompt}`;
        runnerConfig.vectorStore.close();
        return { ...workflowData, summary, nextWorkflowPrompt };
      } else {
        logger.error('Workflow completed but no finished workflow data found', {
          finalState,
          content: finalState?.finishWorkflow?.content,
        });
        runnerConfig.vectorStore.close();
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
