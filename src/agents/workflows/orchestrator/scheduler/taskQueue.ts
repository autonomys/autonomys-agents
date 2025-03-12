import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../../../utils/logger.js';
import { ScheduledTask, TaskQueue } from './types.js';
import { broadcastTaskUpdate } from '../../../../api/server.js';

const logger = createLogger('task-scheduler');

const taskQueues = new Map<string, TaskQueue>();

const MAX_COMPLETED_TASKS = 50;

export const createTaskQueue = (namespace: string): TaskQueue => {
  if (taskQueues.get(namespace)) {
    return taskQueues.get(namespace) as TaskQueue;
  }

  const scheduledTasks: ScheduledTask[] = [];
  const completedTasks: ScheduledTask[] = [];
  let currentTask: ScheduledTask | undefined = undefined;

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
      const task: ScheduledTask = {
        id: uuidv4(),
        message,
        status: 'scheduled',
        createdAt: new Date(),
        scheduledFor: executeAt,
      };

      logger.info(`Scheduling task for ${executeAt.toISOString()} in namespace: ${namespace}`, {
        taskId: task.id,
        scheduledTime: executeAt.toISOString(),
      });

      scheduledTasks.push(task);

      scheduledTasks.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
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
      if (currentTask?.id === id) {
        currentTask.status = status;

        logger.info(`Updating task ${id} status to ${status} in namespace: ${namespace}`);

        if (status === 'completed' || status === 'failed') {
          currentTask.completedAt = new Date();

          if (status === 'completed' && result) {
            currentTask.result = result;
          } else if (status === 'failed' && result) {
            currentTask.error = result;
          }

          completedTasks.push(currentTask);

          currentTask = undefined;
        }
      } else {
        const taskIndex = scheduledTasks.findIndex(task => task.id === id);

        if (taskIndex >= 0) {
          const task = scheduledTasks[taskIndex];
          task.status = status;
          if (status === 'failed') {
            if (result) task.error = result;
            task.completedAt = new Date();
            scheduledTasks.splice(taskIndex, 1);
            completedTasks.push(task);

            logger.info(`Marking scheduled task ${id} as failed in namespace: ${namespace}`);
          }
        } else {
          logger.warn(`Tried to update unknown task: ${id} in namespace: ${namespace}`);
        }
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
