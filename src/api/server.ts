import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import { createLogger } from '../utils/logger.js';
import { OrchestratorRunner } from '../agents/workflows/orchestrator/orchestratorWorkflow.js';
import { ApiServer, LogMetadata } from './types.js';
import { config } from '../config/index.js';
import { HumanMessage } from '@langchain/core/messages';
import asyncHandler from 'express-async-handler';

const logger = createLogger('api-server');

const logStreamClients = new Map<number, { res: Response; namespace: string }>();

const orchestratorRunners = new Map<string, OrchestratorRunner>();

let apiServer: ApiServer | null = null;

const createSingletonApiServer = (): ApiServer => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const apiRouter = Router();

  apiRouter.get('/:namespace/logs', (req: Request, res: Response) => {
    const { namespace } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(
      `data: ${JSON.stringify({ type: 'connection', message: 'Connected to log stream' })}\n\n`,
    );

    const clientId = Date.now();

    logStreamClients.set(clientId, { res, namespace });

    req.on('close', () => {
      logStreamClients.delete(clientId);
      logger.info(`Client ${clientId} disconnected from log stream`);
    });
  });

  apiRouter.get('/health', (_, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  apiRouter.get('/namespaces', (_, res: Response) => {
    res.status(200).json({
      namespaces: Array.from(orchestratorRunners.keys()),
    });
  });

  apiRouter.post(
    '/:namespace/run',
    asyncHandler(async (req: Request, res: Response) => {
      const { namespace } = req.params;
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const runner = orchestratorRunners.get(namespace);
      if (!runner) {
        res.status(404).json({ error: `No runner found for namespace: ${namespace}` });
        return;
      }

      if (runner.getTaskQueue().current) {
        runner.scheduleTask(message, new Date(Date.now()));
        res.status(409).json({ error: 'workflow already running, schedule a task instead' });
        return;
      }

      logger.info(`Starting workflow execution for namespace: ${namespace}`);

      const result = await runner.runWorkflow(
        { messages: [new HumanMessage(message)] },
        { threadId: `api-${namespace}-${Date.now()}` },
      );

      res.status(200).json({
        status: 'success',
        result,
      });
    }),
  );

  apiRouter.get(
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

  apiRouter.post(
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

  apiRouter.post(
    '/:namespace/runNextTask',
    asyncHandler(async (req: Request, res: Response) => {
      const { namespace } = req.params;

      const runner = orchestratorRunners.get(namespace);
      if (!runner) {
        res.status(404).json({ error: `No runner found for namespace: ${namespace}` });
        return;
      }

      if (typeof runner.getNextDueTask !== 'function') {
        res.status(501).json({ error: 'Runner does not support task execution' });
        return;
      }

      const taskQueue = runner.getTaskQueue();

      if (taskQueue.current) {
        res.status(409).json({
          error: 'A task is already running',
          current: taskQueue.current,
        });
        return;
      }

      const nextTask = runner.getNextDueTask();

      if (!nextTask) {
        res.status(404).json({ error: 'No due tasks available' });
        return;
      }

      try {
        logger.info(`Running due task ${nextTask.id} for namespace: ${namespace}`);

        const result = await runner.runWorkflow(
          { messages: [new HumanMessage(nextTask.message)] },
          { threadId: `api-scheduled-${namespace}-${Date.now()}` },
        );

        res.status(200).json({
          status: 'success',
          taskId: nextTask.id,
          result,
        });
      } catch (error: unknown) {
        logger.error('Error executing scheduled task', { error });
        res.status(500).json({
          error: 'Failed to execute scheduled task',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),
  );

  app.use('/api', apiRouter);

  const PORT = config.API_PORT;
  const server = app.listen(PORT, () => {
    logger.info(`API server started on port ${PORT}`);
  });

  const broadcastLog = (namespace: string, level: string, message: string, meta?: LogMetadata) => {
    logStreamClients.forEach((client, clientId) => {
      if (client.namespace === namespace || client.namespace === 'all') {
        const logEvent = {
          type: 'log',
          timestamp: new Date().toISOString(),
          namespace,
          level,
          message,
          meta,
        };

        try {
          client.res.write(`data: ${JSON.stringify(logEvent)}\n\n`);
        } catch (e) {
          logger.error('Error sending to client, removing client', { clientId, error: e });
          logStreamClients.delete(clientId);
        }
      }
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachLogger = (existingLogger: any, namespace: string) => {
    const originalInfo = existingLogger.info;
    const originalDebug = existingLogger.debug;
    const originalError = existingLogger.error;

    existingLogger.info = (msg: string, meta?: LogMetadata) => {
      originalInfo.call(existingLogger, msg, meta);
      broadcastLog(namespace, 'info', msg, meta);
    };

    existingLogger.debug = (msg: string, meta?: LogMetadata) => {
      originalDebug.call(existingLogger, msg, meta);
      broadcastLog(namespace, 'debug', msg, meta);
    };

    existingLogger.error = (msg: string, meta?: LogMetadata) => {
      originalError.call(existingLogger, msg, meta);
      broadcastLog(namespace, 'error', msg, meta);
    };

    return existingLogger;
  };

  return {
    app,
    server,
    registerRunner: (namespace: string, runner: OrchestratorRunner) => {
      orchestratorRunners.set(namespace, runner);
      logger.info(`Registered orchestrator runner with namespace: ${namespace}`);
      return { namespace, runner };
    },
    broadcastLog,
    attachLogger,
    getRegisteredNamespaces: () => {
      return Array.from(orchestratorRunners.keys());
    },
  };
};

export const createApiServer = () => {
  if (!apiServer) {
    apiServer = createSingletonApiServer();
  }
  return apiServer;
};

export const registerRunner = (namespace: string, runner: OrchestratorRunner) => {
  const api = createApiServer();
  return api.registerRunner(namespace, runner);
};

export const broadcastLog = (
  namespace: string,
  level: string,
  message: string,
  meta?: LogMetadata,
) => {
  if (apiServer) {
    apiServer.broadcastLog(namespace, level, message, meta);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const attachLogger = (logger: any, namespace: string) => {
  const api = createApiServer();
  return api.attachLogger(logger, namespace);
};
