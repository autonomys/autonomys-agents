import { createLogger } from '../../utils/logger.js';
import { getRegisteredNamespaces } from './WorkflowController.js';
import { Request, Response } from 'express';
import { namespaceSSEClients } from './StateController.js';
import { randomUUID } from 'crypto';

const logger = createLogger('namespace-controller');

/**
 * Handle a new SSE connection for namespace updates
 */
export const handleNamespaceSSE = (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  // Send initial response to prevent timeout
  res.write('data: {"type":"connection","message":"Connected to namespace updates"}\n\n');

  const clientId = randomUUID();
  namespaceSSEClients.set(clientId, res);

  logger.info(`New client ${clientId} connected to namespace SSE`);

  // Send initial namespaces to the new client
  sendNamespaces(clientId);

  // Handle client disconnect
  req.on('close', () => {
    logger.info(`Client ${clientId} disconnected from namespace SSE`);
    namespaceSSEClients.delete(clientId);
  });
};

/**
 * Send namespaces to a specific SSE client
 */
const sendNamespaces = (clientId: string) => {
  const client = namespaceSSEClients.get(clientId);
  if (!client) return;

  try {
    const namespaces = getRegisteredNamespaces();
    const message = JSON.stringify({
      type: 'namespaces',
      data: namespaces,
    });

    client.write(`data: ${message}\n\n`);
  } catch (error) {
    logger.error(`Error sending namespaces to client ${clientId}:`, error);
  }
};

/**
 * Broadcast namespace updates to all connected clients
 */
export const broadcastNamespaces = () => {
  const namespaces = getRegisteredNamespaces();
  const message = JSON.stringify({
    type: 'namespaces',
    data: namespaces,
    timestamp: new Date().toISOString(),
  });

  let clientCount = 0;
  namespaceSSEClients.forEach((client, clientId) => {
    try {
      client.write(`data: ${message}\n\n`);
      clientCount++;
    } catch (error) {
      logger.error(`Error broadcasting to client ${clientId}, removing client:`, error);
      namespaceSSEClients.delete(clientId);
    }
  });

  logger.debug(`Broadcasted namespaces to ${clientCount} clients`);
};
