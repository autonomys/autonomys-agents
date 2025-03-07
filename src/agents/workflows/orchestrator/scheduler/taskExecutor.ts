import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorRunner } from '../orchestratorWorkflow.js';
import { HumanMessage } from '@langchain/core/messages';
import { broadcastTaskUpdate } from '../../../../api/server.js';
const logger = createLogger('task-executor');

export const startTaskExecutor = (
  runner: OrchestratorRunner,
  namespace: string,
  checkIntervalMs = 10000,
): (() => void) => {
  let running = true;

  const executeNextTask = async () => {
    try {
      const dueTask = runner.getNextDueTask();

      if (dueTask) {
        logger.info(`Executing scheduled task ${dueTask.id}`, {
          scheduledFor: dueTask.scheduledFor.toISOString(),
          message: dueTask.message,
        });
        
        // Task is already marked as processing in getNextDueTask
        // Just broadcast this update to all clients
        broadcastTaskUpdate(namespace);

        const result = await runner.runWorkflow(
          {
            messages: [new HumanMessage(dueTask.message)],
          },
          {
            threadId: `scheduled-${dueTask.id}`,
          },
        );
        logger.info(`Task ${dueTask.id} completed successfully`, {
          result,
        });

        broadcastTaskUpdate(namespace);
      }
    } catch (error: unknown) {
      logger.error('Error executing scheduled task', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const scheduleNextRun = async () => {
    if (!running) return;

    try {
      const { nextTask, msUntilNext } = runner.getTimeUntilNextTask();

      if (nextTask && msUntilNext !== null && msUntilNext <= 0) {
        await executeNextTask();

        setTimeout(scheduleNextRun, 100);
      } else if (nextTask && msUntilNext !== null) {
        const nextCheckIn = Math.min(msUntilNext, checkIntervalMs);
        setTimeout(scheduleNextRun, nextCheckIn);
      } else {
        logger.debug('No scheduled tasks pending');
        setTimeout(scheduleNextRun, checkIntervalMs);
      }
    } catch (error: unknown) {
      logger.error('Error in task executor scheduling', {
        error: error instanceof Error ? error.message : String(error),
      });

      setTimeout(scheduleNextRun, checkIntervalMs);
    }
  };

  scheduleNextRun();

  return () => {
    running = false;
    logger.info('Task executor stopped');
  };
};
