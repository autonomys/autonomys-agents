import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { broadcastTaskUpdate } from '../server.js';
import { orchestratorRunners } from './StateController.js';

export const executeWorkflow = asyncHandler(async (req: Request, res: Response) => {
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

  runner.scheduleTask(message, new Date(Date.now()));
  broadcastTaskUpdate(namespace);

  res.status(200).json({
    status: 'success',
  });
});

export const externalStopWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const namespaces = getRegisteredNamespaces();
  for (const namespace of namespaces) {
    const runner = orchestratorRunners.get(namespace);
    if (!runner) {
      res.status(404).json({ error: `No runner found for namespace: ${namespace}` });
      return;
    }

    runner.externalStopWorkflow(reason);
  }

  res.status(200).json({ status: 'success' });
});

export const getRegisteredNamespaces = (): string[] => {
  return Array.from(orchestratorRunners.keys());
};
