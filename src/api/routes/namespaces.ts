import { Router } from 'express';
import { getRegisteredNamespaces } from '../controller/WorkflowController.js';
import { handleNamespaceSSE } from '../controller/NamespaceController.js';

export const createNamespacesRouter = (): Router => {
  const router = Router();

  // GET endpoint for SSE connection
  router.get('/namespaces/sse', handleNamespaceSSE);

  // GET endpoint for one-time fetch
  router.get('/namespaces', (req, res) => {
    const namespaces = getRegisteredNamespaces();
    res.json({ namespaces });
  });

  return router;
};
