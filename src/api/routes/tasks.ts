import { Request, Response, Router } from 'express';
import { broadcastTaskUpdate, orchestratorRunners, taskStreamClients } from '../server.js';
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

        broadcastTaskUpdate(namespace);
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

          broadcastTaskUpdate(namespace);
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

            broadcastTaskUpdate(namespace);
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

  router.delete(
    '/:namespace/task/:taskId',
    asyncHandler(async (req: Request, res: Response) => {
      const { namespace, taskId } = req.params;

      const runner = orchestratorRunners.get(namespace);
      if (!runner) {
        res.status(404).json({ error: `No runner found for namespace: ${namespace}` });
        return;
      }

      if (typeof runner.deleteTask !== 'function') {
        res.status(501).json({ error: 'Runner does not support task deletion' });
        return;
      }

      runner.deleteTask(taskId);

      res.status(200).json({
        status: 'success',
        message: `Task ${taskId} deleted successfully`,
      });

      broadcastTaskUpdate(namespace);
    }),
  );

  router.get('/:namespace/taskStream', (req: Request, res: Response) => {
    const { namespace } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(
      `data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to task stream',
        timestamp: new Date().toISOString(),
      })}\n\n`,
    );

    const runner = orchestratorRunners.get(namespace);
    if (runner && typeof runner.getTaskQueue === 'function') {
      const tasks = runner.getTaskQueue();
      res.write(
        `data: ${JSON.stringify({
          type: 'tasks',
          timestamp: new Date().toISOString(),
          namespace,
          tasks,
        })}\n\n`,
      );
    }

    const clientId = Date.now();
    taskStreamClients.set(clientId, { res, namespace });

    req.on('close', () => {
      taskStreamClients.delete(clientId);
      logger.info(`Client ${clientId} disconnected from task stream`);
    });
  });

  return router;
};
