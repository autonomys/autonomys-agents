import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { HumanMessage } from '@langchain/core/messages';
import { broadcastTaskUpdateUtility } from './TaskController.js';
import { createLogger } from '../../utils/logger.js';
import { orchestratorRunners } from './StateController.js';
import { OrchestratorRunner } from '../../agents/workflows/orchestrator/orchestratorWorkflow.js';

const logger = createLogger('api-server-workflow-controller');

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

  if (runner.getTaskQueue().current) {
    runner.scheduleTask(message, new Date(Date.now()));
    broadcastTaskUpdateUtility(namespace);
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
});

////// Utility functions //////
export const registerRunnerUtility = (
  namespace: string,
  runner: OrchestratorRunner,
): { namespace: string; runner: OrchestratorRunner } => {
  orchestratorRunners.set(namespace, runner);
  logger.info(`Registered orchestrator runner with namespace: ${namespace}`);
  return { namespace, runner };
};

export const getRegisteredNamespaces = (): string[] => {
  return Array.from(orchestratorRunners.keys());
};
