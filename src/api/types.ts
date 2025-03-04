import { Express } from 'express';
import { Server } from 'http';
import { OrchestratorRunner } from '../agents/workflows/orchestrator/orchestratorWorkflow.js';

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
  attachLogger: (logger: any, namespace: string) => any;
  getRegisteredNamespaces: () => string[];
}

export interface LogMetadata {
  [key: string]: string | number | boolean | null | undefined | object | any[];
}
