import { Request, Response } from 'express';
import { orchestratorRunners } from './StateController.js';

export const getHealth = (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
};

export const getNamespaces = (_req: Request, res: Response) => {
  res.status(200).json({
    namespaces: Array.from(orchestratorRunners.keys()),
  });
};
