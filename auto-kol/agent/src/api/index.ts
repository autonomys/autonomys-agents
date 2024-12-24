import { Router } from 'express';
import healthRoutes from './routes/health.js';
import responseRoutes from './routes/responses.js';
import tweetRoutes from './routes/tweets.js';
import dsnRoutes from './routes/dsn.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/', responseRoutes);
router.use('/', tweetRoutes);
router.use('/', dsnRoutes);

export default router;
