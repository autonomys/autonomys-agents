import { Router } from 'express';
import memoriesRouter from './memories.js';
import healthRouter from './health.js';

const router = Router();

router.use('/memories', memoriesRouter);
router.use('/health', healthRouter);

export default router; 