import { Request, Response, Router } from 'express';
import { orchestratorRunners } from '../server.js';
import { createLogger } from '../../utils/logger.js';
import asyncHandler from 'express-async-handler';

const logger = createLogger('api-server');

export const createTasksRouter = (): Router => {
  const router = Router();

  router.get(
    '/:namespace/tasks',
    asyncHandler(async (req: Request, res: Response) => {
      const { namespace } = req.params;

      const runner = orchestratorRunners.get(namespace);
      if (!runner) {
        res.status(404).json({ error: `No runner found for namespace: ${namespace}` });
        return;
      }

      if (typeof runner.getTaskQueue !== 'function') {
        res.status(501).json({ error: 'Runner does not support task queue' });
        return;
      }

      const tasks = runner.getTaskQueue();

      res.status(200).json({
        namespace,
        tasks,
      });
    }),
  );

  router.post(
    '/:namespace/addTask',
    asyncHandler(async (req: Request, res: Response) => {
      const { namespace } = req.params;
      const { message, scheduledTime } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const runner = orchestratorRunners.get(namespace);
      if (!runner) {
        res.status(404).json({ error: `No runner found for namespace: ${namespace}` });
        return;
      }

      if (typeof runner.scheduleTask !== 'function') {
        res.status(501).json({ error: 'Runner does not support task scheduling' });
        return;
      }

      if (scheduledTime) {
        const executeAt = new Date(scheduledTime);

        if (isNaN(executeAt.getTime())) {
          res.status(400).json({ error: 'Invalid scheduledTime format' });
          return;
        }

        const task = runner.scheduleTask(message, executeAt);

        res.status(201).json({
          status: 'success',
          task,
          message: `Task scheduled for ${executeAt.toISOString()}`,
        });
      } else {
        const taskQueue = runner.getTaskQueue();

        if (taskQueue.current) {
          const executeAt = new Date(Date.now() + 5000);
          const task = runner.scheduleTask(message, executeAt);

          res.status(202).json({
            status: 'delayed',
            task,
            message: `Task scheduled for immediate execution after current task completes (${executeAt.toISOString()})`,
          });
        } else {
          try {
            logger.info(`Running immediate task for namespace: ${namespace}`);
            const executeAt = new Date(Date.now() + 2000);
            const task = runner.scheduleTask(message, executeAt);
            res.status(200).json({
              status: 'success',
              task,
              message: `Task scheduled for immediate execution after current task completes (${executeAt.toISOString()})`,
            });
          } catch (error: unknown) {
            logger.error('Error executing immediate task', { error });
            res.status(500).json({
              error: 'Failed to execute task',
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
    }),
  );

  return router;
};
