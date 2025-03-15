import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../../../utils/logger.js';
import { ScheduledTask, TaskQueue } from './types.js';
import { broadcastTaskUpdate } from '../../../../api/server.js';
import * as DbController from './db/dbController.js';

const logger = createLogger('task-scheduler');

const taskQueues = new Map<string, TaskQueue>();

const MAX_COMPLETED_TASKS = 50;
const MAX_SCHEDULED_TASKS = 100;

export const createTaskQueue = (namespace: string): TaskQueue => {
  if (taskQueues.get(namespace)) {
    return taskQueues.get(namespace) as TaskQueue;
  }

  const scheduledTasks: ScheduledTask[] = [];
  const completedTasks: ScheduledTask[] = [];
  let currentTask: ScheduledTask | undefined = undefined;

  try {
    const dbProcessingTasks = DbController.getTasks({
      namespace,
      status: 'processing',
    });

    const dbScheduledTasks = DbController.getTasks({
      namespace,
      status: 'scheduled',
      limit: MAX_SCHEDULED_TASKS,
    });

    const dbCompletedTasks = DbController.getTasks({
      namespace,
      status: ['completed', 'failed'],
      limit: MAX_COMPLETED_TASKS,
    });

    for (const dbTask of [...dbScheduledTasks, ...dbProcessingTasks, ...dbCompletedTasks]) {
      const task: ScheduledTask = {
        id: dbTask.id,
        namespace,
        message: dbTask.message,
        status: dbTask.status,
        createdAt: new Date(dbTask.createdAt),
        scheduledFor: new Date(dbTask.scheduledFor),
        startedAt: dbTask.startedAt ? new Date(dbTask.startedAt) : undefined,
        completedAt: dbTask.completedAt ? new Date(dbTask.completedAt) : undefined,
        result: dbTask.result,
        error: dbTask.error,
      };

      if (dbTask.status === 'scheduled') {
        scheduledTasks.push(task);
      } else if (dbTask.status === 'processing') {
        task.status = 'scheduled';
        scheduledTasks.push(task);

        DbController.updateTaskStatus({
          id: task.id,
          namespace,
          status: 'scheduled',
        });
      } else {
        completedTasks.push(task);
      }
    }

    scheduledTasks.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

    logger.info(
      `Loaded ${scheduledTasks.length} scheduled tasks and ${completedTasks.length} completed tasks from database for namespace: ${namespace}`,
    );
  } catch (error) {
    logger.error(
      `Failed to load tasks from database: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const queue: TaskQueue = {
    get currentTask() {
      return currentTask;
    },
    get scheduledTasks() {
      return [...scheduledTasks].sort(
        (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime(),
      );
    },
    get completedTasks() {
      return [...completedTasks];
    },

    scheduleTask(message: string, executeAt: Date): ScheduledTask {
      const taskId = uuidv4();
      const now = new Date();

      const task: ScheduledTask = {
        id: taskId,
        namespace,
        message,
        status: 'scheduled',
        createdAt: now,
        scheduledFor: executeAt,
      };

      logger.info(`Scheduling task for ${executeAt.toISOString()} in namespace: ${namespace}`, {
        taskId: task.id,
        scheduledTime: executeAt.toISOString(),
      });

      scheduledTasks.push(task);
      scheduledTasks.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

      try {
        DbController.createTask({
          id: taskId,
          namespace,
          message,
          status: 'scheduled',
          created_at: now.toISOString(),
          scheduled_for: executeAt.toISOString(),
        });
      } catch (error) {
        logger.error(
          `Failed to persist task to database: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      broadcastTaskUpdate(namespace);

      return task;
    },

    getNextDueTask(): ScheduledTask | undefined {
      if (currentTask) {
        logger.info(`Cannot get next task, a task is already running in namespace: ${namespace}`, {
          runningTaskId: currentTask.id,
        });
        return undefined;
      }

      if (scheduledTasks.length === 0) {
        return undefined;
      }

      const now = new Date();
      const nextTask = scheduledTasks[0];

      if (nextTask.scheduledFor <= now) {
        scheduledTasks.shift();

        nextTask.status = 'processing';
        nextTask.startedAt = now;

        try {
          logger.info(`Marking task ${nextTask.id} as processing in database`, {
            namespace,
            taskId: nextTask.id,
          });

          DbController.markTaskAsProcessing(namespace, nextTask.id);
        } catch (error) {
          logger.error(
            `Failed to update task status in database: ${error instanceof Error ? error.message : String(error)}`,
            {
              namespace,
              taskId: nextTask.id,
            },
          );
        }

        currentTask = nextTask;

        logger.info(`Starting scheduled task in namespace: ${namespace}`, {
          taskId: nextTask.id,
          scheduledFor: nextTask.scheduledFor.toISOString(),
          startedAt: now.toISOString(),
        });

        return nextTask;
      }

      return undefined;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTaskStatus(id: string, status: ScheduledTask['status'], result?: any): void {
      let task: ScheduledTask | undefined;
      let isCurrentTask = false;

      if (currentTask?.id === id) {
        task = currentTask;
        isCurrentTask = true;
      } else {
        const taskIndex = scheduledTasks.findIndex(t => t.id === id);
        if (taskIndex >= 0) {
          task = scheduledTasks[taskIndex];
          if (status === 'completed' || status === 'failed' || status === 'deleted') {
            scheduledTasks.splice(taskIndex, 1);
          }
        }
      }

      if (!task) {
        logger.warn(`Tried to update unknown task: ${id} in namespace: ${namespace}`);
        return;
      }

      logger.info(`Updating task ${id} status to ${status} in namespace: ${namespace}`);
      task.status = status;

      if (status === 'completed' || status === 'failed' || status === 'deleted') {
        task.completedAt = new Date();

        if (status === 'completed' && result) {
          task.result = result;
        } else if (status === 'failed' && result) {
          task.error = result;
        }

        completedTasks.push(task);

        if (isCurrentTask) {
          currentTask = undefined;
        }
      }

      try {
        switch (status) {
          case 'completed':
            DbController.markTaskAsCompleted(namespace, id, result);
            break;

          case 'failed':
            const errorMsg =
              typeof result === 'string'
                ? result
                : result
                  ? JSON.stringify(result)
                  : 'Task failed without specific error';
            DbController.markTaskAsFailed(namespace, id, errorMsg);
            break;

          case 'processing':
            DbController.markTaskAsProcessing(namespace, id);
            break;

          default:
            throw new Error(`Unknown task status: ${status}`);
        }
      } catch (error) {
        logger.error(
          `Failed to update task status in database: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      broadcastTaskUpdate(namespace);
    },

    deleteTask(id: string): void {
      const taskIndex = scheduledTasks.findIndex(task => task.id === id);
      if (taskIndex >= 0) {
        scheduledTasks[taskIndex].status = 'deleted';
        const deletedTask = scheduledTasks.splice(taskIndex, 1)[0];
        deletedTask.completedAt = new Date();
        completedTasks.push(deletedTask);

        try {
          DbController.deleteTask(namespace, id);
        } catch (error) {
          logger.error(
            `Failed to delete task from database: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      logger.info(`Deleted task ${id} in namespace: ${namespace}`);
      broadcastTaskUpdate(namespace);
    },

    getAllTasks() {
      return {
        current: currentTask,
        scheduled: this.scheduledTasks,
        completed: [...completedTasks].slice(-MAX_COMPLETED_TASKS),
      };
    },

    getTimeUntilNextTask() {
      if (scheduledTasks.length === 0) {
        return { nextTask: undefined, msUntilNext: null };
      }

      const now = new Date();
      const nextTask = scheduledTasks[0];

      if (nextTask.scheduledFor <= now) {
        return { nextTask, msUntilNext: 0 };
      }

      const msUntilNext = nextTask.scheduledFor.getTime() - now.getTime();
      return { nextTask, msUntilNext };
    },
  };

  taskQueues.set(namespace, queue);

  return queue;
};
