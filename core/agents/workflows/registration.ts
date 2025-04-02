import { OrchestratorRunner } from './orchestrator/orchestratorWorkflow.js';
import { broadcastNamespacesUpdate } from '../../api/server.js';

export const orchestratorRunners = new Map<string, OrchestratorRunner>();

export const registerOrchestratorRunner = (namespace: string, runner: OrchestratorRunner) => {
  orchestratorRunners.set(namespace, runner);

  // Broadcast namespace updates to connected WebSocket clients
  broadcastNamespacesUpdate();
};
