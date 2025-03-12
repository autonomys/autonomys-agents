import { Response } from 'express';
import { orchestratorRunners } from '../../agents/workflows/registration.js';

export { orchestratorRunners };
export const logStreamClients = new Map<number, { res: Response; namespace: string }>();
export const taskStreamClients = new Map<number, { res: Response; namespace: string }>();
export const chatStreamClients = new Map<number, { res: Response; namespace: string }>();
