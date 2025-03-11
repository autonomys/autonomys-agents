import { Response } from 'express';
import { OrchestratorRunner } from '../../agents/workflows/orchestrator/orchestratorWorkflow.js';

export const logStreamClients = new Map<number, { res: Response; namespace: string }>();
export const taskStreamClients = new Map<number, { res: Response; namespace: string }>();
export const orchestratorRunners = new Map<string, OrchestratorRunner>();
export const chatStreamClients = new Map<number, { res: Response; namespace: string }>();
