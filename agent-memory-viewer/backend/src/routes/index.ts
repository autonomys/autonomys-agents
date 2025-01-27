import { Router } from 'express';
import memoriesRouter from './memories.js';
import healthRouter from './health.js';
import agentsRouter from './agents.js';

const router = Router();

router.use('/memories', memoriesRouter);
router.use('/health', healthRouter);
router.use('/', agentsRouter);

export default router;
