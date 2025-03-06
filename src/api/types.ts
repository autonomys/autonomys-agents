import { Express } from 'express';
import { Server } from 'http';
import { OrchestratorRunner } from '../agents/workflows/orchestrator/orchestratorWorkflow.js';
import { Logger } from 'winston';

export interface ApiServer {
  app: Express;
  server: Server;
  registerRunner: (
    namespace: string,
    runner: OrchestratorRunner,
  ) => {
    namespace: string;
    runner: OrchestratorRunner;
  };
  broadcastLog: (namespace: string, level: string, message: string, meta?: LogMetadata) => void;
  attachLogger: (logger: Logger, namespace: string) => Logger;
  getRegisteredNamespaces: () => string[];
}

export interface LogMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: string | number | boolean | null | undefined | object | any[];
}
