import { OrchestratorRunner } from './orchestrator/orchestratorWorkflow.js';

export const orchestratorRunners = new Map<string, OrchestratorRunner>();

export const registerOrchestratorRunner = (namespace: string, runner: OrchestratorRunner) => {
  orchestratorRunners.set(namespace, runner);
};
