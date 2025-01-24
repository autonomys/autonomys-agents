import { WebSocket, WebSocketServer } from 'ws';
import { createLogger } from './utils/logger.js';
import { config } from './config/index.js';

const logger = createLogger('websocket');

let wss: WebSocketServer | null = null;

export function createWebSocketServer() {
  if (wss) {
    logger.info('WebSocket server already exists, closing...');
    wss.close(() => {
      logger.info('Existing WebSocket server closed');
    });
  }

  wss = new WebSocketServer({ port: config.WS_PORT }, () => {
    logger.info(`WebSocket server is running on port ${config.WS_PORT}`);
  });

  wss.on('connection', ws => {
    clients.add(ws);
    logger.info('New client connected');

    ws.on('close', () => {
      clients.delete(ws);
      logger.info('Client disconnected');
    });
  });

  wss.on('error', error => {
    if ((error as any).code === 'EADDRINUSE') {
      logger.error(`Port ${config.WS_PORT} is already in use. Retrying in 1 second...`);
      setTimeout(() => {
        wss?.close(() => {
          createWebSocketServer();
        });
      }, 1000);
    } else {
      logger.error('WebSocket server error:', error);
    }
  });

  return wss;
}

const clients = new Set<WebSocket>();

export function broadcastNewMemory(memory: any) {
  if (!wss) return;

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: 'NEW_MEMORY',
          data: memory,
        }),
      );
    }
  });
}

export function closeWebSocketServer() {
  return new Promise<void>(resolve => {
    if (!wss) {
      resolve();
      return;
    }

    wss.close(() => {
      logger.info('WebSocket server closed');
      wss = null;
      resolve();
    });
  });
}
