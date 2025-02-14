import express from 'express';
import { setupSecurity } from './middleware/security.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

app.set('trust proxy', 1);

setupSecurity(app);

app.use(requestLogger);

app.use('/', routes);

app.use(errorHandler);

export default app;
