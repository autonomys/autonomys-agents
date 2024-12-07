import { Router } from 'express';
import healthRoutes from './routes/health.js';
import responseRoutes from './routes/responses.js';
import tweetRoutes from './routes/tweets.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/', responseRoutes);
router.use('/', tweetRoutes);

export default router;