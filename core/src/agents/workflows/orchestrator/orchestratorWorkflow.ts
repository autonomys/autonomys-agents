import { BaseMessage } from '@langchain/core/messages';
import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { Character } from '../../../config/characters.js';
import { createLogger } from '../../../utils/logger.js';
import { Logger } from 'winston';
import { cleanMessageData } from './cleanMessages.js';
import { createNodes } from './nodes.js';
import { parseFinishedWorkflow } from './nodes/finishWorkflowNode.js';
import { FinishedWorkflow } from './nodes/finishWorkflowPrompt.js';
import { OrchestratorState } from './state.js';
import {
  OrchestratorInput,
  OrchestratorRunnerOptions,
  OrchestratorStateType,
  PruningParameters,
} from './types.js';
import { createTaskQueue } from './scheduler/taskQueue.js';
import { Task, TaskQueue } from './scheduler/types.js';
import { closeVectorDB } from '../../../services/vectorDb/vectorDBPool.js';
import { createOrchestratorConfig, defaultOrchestratorOptions } from './config.js';

export const workflowControlState = new Map<string, { shouldStop: boolean; reason: string }>();

/**
 * Handles the conditional edge routing in the workflow graph based on current state
 */
const handleConditionalEdge = async (
  state: OrchestratorStateType,
  pruningParameters: PruningParameters,
  workflowLogger: Logger,
  namespace: string,
) => {
  const externalTerminationKey = `${namespace}:external-stop`;
  if (workflowControlState.has(namespace) || workflowControlState.has(externalTerminationKey)) {
    const key = workflowControlState.has(namespace) ? namespace : externalTerminationKey;
    workflowLogger.info('Workflow stop requested', {
      reason: workflowControlState.get(key)?.reason,
    });
    workflowControlState.delete(key);
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

/**
 * Creates the workflow graph for the orchestrator
 */
const createOrchestratorWorkflow = async (
  nodes: Awaited<ReturnType<typeof createNodes>>,
  pruningParameters: PruningParameters,
  workflowLogger: Logger,
  namespace: string,
) => {
  const workflow = new StateGraph(OrchestratorState(pruningParameters))
    .addNode('input', nodes.inputNode)
    .addNode('messageSummary', nodes.messageSummaryNode)
    .addNode('finishWorkflow', nodes.finishWorkflowNode)
    .addNode('toolExecution', nodes.toolExecutionNode)
    .addEdge(START, 'input')
    .addConditionalEdges('input', state =>
      handleConditionalEdge(state, pruningParameters, workflowLogger, namespace),
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
  // Stop the workflow
  externalStopWorkflow: (reason?: string) => void;

  // Scheduled task management methods
  scheduleTask: (message: string, executeAt: Date) => Task;
  getNextDueTask: () => Task | undefined;
  getTaskQueue: (limit?: number) => ReturnType<TaskQueue['getAllTasks']>;
  getTimeUntilNextTask: () => { nextTask?: Task; msUntilNext: number | null };
  updateTaskStatus: (id: string, status: Task['status'], result?: string) => void;
  deleteTask: (id: string) => void;
}>;

/**
 * Creates an orchestrator runner with the given configuration
 */
export const createOrchestratorRunner = async (
  character: Character,
  options?: OrchestratorRunnerOptions,
): Promise<OrchestratorRunner> => {
  const runnerConfig = await createOrchestratorConfig(character, options);
  const { namespace, pruningParameters, recursionLimit, monitoringConfig } = runnerConfig;

  const workflowLogger =
    options?.logger || createLogger(`orchestrator-workflow-${runnerConfig.namespace}`);

  const nodes = await createNodes(runnerConfig);
  const workflow = await createOrchestratorWorkflow(
    nodes,
    pruningParameters,
    workflowLogger,
    namespace,
  );

  const memoryStore = new MemorySaver();
  const app = workflow.compile({ checkpointer: memoryStore });

  const taskQueue = createTaskQueue(namespace);

  return {
    runWorkflow: async (
      input?: OrchestratorInput,
      options?: { threadId?: string },
    ): Promise<FinishedWorkflow> => {
      const threadId = `${options?.threadId}-${Date.now()}`;
      workflowLogger.info('Starting orchestrator workflow', { threadId });

      const config = {
        recursionLimit,
        configurable: {
          ...pruningParameters,
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

      if (monitoringConfig.enabled) {
        const rawMessages: BaseMessage[] | undefined = (await memoryStore.getTuple(config))
          ?.checkpoint.channel_values.messages as BaseMessage[];

        const cleanedMessages = monitoringConfig.messageCleaner
          ? monitoringConfig.messageCleaner(rawMessages)
          : cleanMessageData(rawMessages);

        const dsnUpload = await monitoringConfig.monitoringExperienceManager.saveExperience({
          messages: cleanedMessages,
          namespace,
          type: 'monitoring',
        });
        workflowLogger.info('Dsn upload', { dsnUpload });
      }

      if (finalState?.finishWorkflow?.messages?.[0]?.content) {
        const { summary } = await parseFinishedWorkflow(
          finalState.finishWorkflow.messages[0].content,
          workflowLogger,
        );

        const workflowSummary = `This action finished running at ${new Date().toISOString()}. Action summary: ${summary}`;
        const result = { summary: workflowSummary };

        taskQueue.updateTaskStatus(taskQueue.currentTask?.id || '', 'completed', result.summary);
        closeVectorDB(namespace);
        return result;
      } else {
        workflowLogger.error('Workflow completed but no finished workflow data found', {
          finalState,
          content: finalState?.finishWorkflow?.content,
        });
        return { summary: 'Extracting workflow data failed' };
      }
    },

    externalStopWorkflow: async (reason?: string): Promise<void> => {
      workflowLogger.info('Stopping orchestrator workflow', { reason });
      const currentTask = taskQueue.currentTask;
      if (currentTask) {
        taskQueue.updateTaskStatus(currentTask.id, 'failed', `Terminated by user: ${reason}`);
        workflowLogger.info('Terminated current task', { taskId: currentTask.id });
        const externalTerminationKey = `${namespace}:external-stop`;
        workflowControlState.set(externalTerminationKey, {
          shouldStop: true,
          reason: reason || 'Unknown',
        });
      } else {
        workflowLogger.info('No current task to terminate');
      }
    },

    scheduleTask: (message: string, executeAt: Date): Task => {
      return taskQueue.scheduleTask(message, executeAt);
    },

    getNextDueTask: (): Task | undefined => {
      return taskQueue.getNextDueTask();
    },

    getTaskQueue: (limit?: number) => {
      return taskQueue.getAllTasks(limit);
    },

    getTimeUntilNextTask: () => {
      return taskQueue.getTimeUntilNextTask();
    },

    updateTaskStatus: (id: string, status: Task['status'], result?: string) => {
      return taskQueue.updateTaskStatus(id, status, result);
    },

    deleteTask: (id: string) => {
      return taskQueue.deleteTask(id);
    },
  };
};

/**
 * Gets or creates an orchestrator runner for a specific namespace
 */
export const getOrCreateOrchestratorRunner = (() => {
  const runners: Map<string, Promise<OrchestratorRunner>> = new Map();

  return (character: Character, runnerOptions: OrchestratorRunnerOptions) => {
    const namespace = runnerOptions.namespace ?? defaultOrchestratorOptions.namespace;

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
