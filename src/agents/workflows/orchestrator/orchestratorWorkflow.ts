import { BaseMessage } from '@langchain/core/messages';
import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { uploadToDsn } from '../../../blockchain/autoDrive/autoDriveUpload.js';
import { Character } from '../../../config/characters.js';
import { LLMConfiguration } from '../../../services/llm/types.js';
import { createLogger } from '../../../utils/logger.js';
import { Logger } from 'winston';
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
import { createTaskQueue } from './scheduler/taskQueue.js';
import { ScheduledTask, TaskQueue } from './scheduler/types.js';
import { closeVectorDB } from '../../../services/vectorDb/vectorDBPool.js';

const handleConditionalEdge = async (
  state: OrchestratorStateType,
  pruningParameters: PruningParameters,
  workflowLogger: Logger,
) => {
  workflowLogger.debug('State in conditional edge', { state });
  if (state.workflowControl && state.workflowControl.shouldStop) {
    workflowLogger.info('Workflow stop requested', { reason: state.workflowControl.reason });
    return 'finishWorkflow';
  }

  if (state.toolCalls && state.toolCalls.length > 0) {
    return 'toolExecution';
  }

  // Check if we need to summarize messages based on pruning parameters
  if (state.messages.length > pruningParameters.maxQueueSize) {
    workflowLogger.info('Messages exceed maxQueueSize, triggering summary', {
      messageCount: state.messages.length,
      maxQueueSize: pruningParameters.maxQueueSize,
    });
    return 'messageSummary';
  }

  // Skip message summary if not needed
  workflowLogger.info('Not summarizing, not enough messages', {
    messageCount: state.messages.length,
    maxQueueSize: pruningParameters.maxQueueSize,
  });
  return 'input';
};

const createOrchestratorWorkflow = async (
  nodes: Awaited<ReturnType<typeof createNodes>>,
  pruningParameters: PruningParameters,
  workflowLogger: Logger,
) => {
  const workflow = new StateGraph(OrchestratorState(pruningParameters))
    .addNode('input', nodes.inputNode)
    .addNode('messageSummary', nodes.messageSummaryNode)
    .addNode('finishWorkflow', nodes.finishWorkflowNode)
    .addNode('toolExecution', nodes.toolExecutionNode)
    .addEdge(START, 'input')
    .addConditionalEdges('input', state =>
      handleConditionalEdge(state, pruningParameters, workflowLogger),
    )
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

  // Scheduled task management methods
  scheduleTask: (message: string, executeAt: Date) => ScheduledTask;
  getNextDueTask: () => ScheduledTask | undefined;
  getTaskQueue: () => ReturnType<TaskQueue['getAllTasks']>;
  getTimeUntilNextTask: () => { nextTask?: ScheduledTask; msUntilNext: number | null };
  deleteTask: (id: string) => void;
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
  recursionLimit: 100,
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

  const tools = [
    ...(options?.tools || []),
    ...createDefaultOrchestratorTools(mergedOptions.saveExperiences),
  ];
  const prompts = options?.prompts || (await createPrompts(character));
  const monitoring = {
    ...defaultOptions.monitoring,
    ...options?.monitoring,
  };
  return {
    ...mergedOptions,
    tools,
    modelConfigurations,
    prompts,
    monitoring,
    logger: options?.logger,
  };
};

export const createOrchestratorRunner = async (
  character: Character,
  options?: OrchestratorRunnerOptions,
): Promise<OrchestratorRunner> => {
  const runnerConfig = await createOrchestratorRunnerConfig(character, options);

  const workflowLogger =
    options?.logger || createLogger(`orchestrator-workflow-${runnerConfig.namespace}`);

  const nodes = await createNodes(runnerConfig);
  const workflow = await createOrchestratorWorkflow(
    nodes,
    runnerConfig.pruningParameters,
    workflowLogger,
  );

  const memoryStore = new MemorySaver();
  const app = workflow.compile({ checkpointer: memoryStore });

  const namespace = runnerConfig.namespace || 'orchestrator';
  const taskQueue = createTaskQueue(namespace);

  return {
    runWorkflow: async (
      input?: OrchestratorInput,
      options?: { threadId?: string },
    ): Promise<FinishedWorkflow> => {
      const threadId = `${options?.threadId || 'orchestrator'}-${Date.now()}`;
      workflowLogger.info('Starting orchestrator workflow', { threadId });

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

      workflowLogger.info('Workflow completed', {
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
        workflowLogger.info('Dsn upload', { dsnUpload });
      }

      if (finalState?.finishWorkflow?.messages?.[0]?.content) {
        const { summary } = await parseFinishedWorkflow(
          finalState.finishWorkflow.messages[0].content,
        );

        const workflowSummary = `This action finished running at ${new Date().toISOString()}. Action summary: ${summary}`;
        const result = { summary: workflowSummary };

        taskQueue.updateTaskStatus(taskQueue.currentTask?.id || '', 'completed', result);
        closeVectorDB(defaultOptions.namespace);
        return result;
      } else {
        workflowLogger.error('Workflow completed but no finished workflow data found', {
          finalState,
          content: finalState?.finishWorkflow?.content,
        });
        return { summary: 'Extracting workflow data failed' };
      }
    },

    scheduleTask: (message: string, executeAt: Date): ScheduledTask => {
      return taskQueue.scheduleTask(message, executeAt);
    },

    getNextDueTask: (): ScheduledTask | undefined => {
      return taskQueue.getNextDueTask();
    },

    getTaskQueue: () => {
      return taskQueue.getAllTasks();
    },

    getTimeUntilNextTask: () => {
      return taskQueue.getTimeUntilNextTask();
    },

    deleteTask: (id: string) => {
      return taskQueue.deleteTask(id);
    },
  };
};

export const getOrchestratorRunner = (() => {
  const runners: Map<string, Promise<OrchestratorRunner>> = new Map();

  return (character: Character, runnerOptions: OrchestratorRunnerOptions) => {
    const namespace = runnerOptions.namespace ?? defaultOptions.namespace;

    if (!runners.has(namespace)) {
      const runnerPromise = createOrchestratorRunner(character, runnerOptions);
      runners.set(namespace, runnerPromise);
    }

    const runner = runners.get(namespace);
    if (!runner) {
      throw new Error(`Runner for namespace ${namespace} not found`);
    }

    return runner;
  };
})();
