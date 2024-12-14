import { WebSocket, WebSocketServer } from 'ws';
import { createLogger } from './utils/logger.js';

const logger = createLogger('websocket');
const wss = new WebSocketServer({ port: 3011 });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
    clients.add(ws);
    logger.info('New client connected');

    ws.on('close', () => {
        clients.delete(ws);
        logger.info('Client disconnected');
    });
});

export function broadcastNewMemory(memory: any) {
    clients.forEach(client => {
        if (client.readyState === 1) { 
            client.send(JSON.stringify({
                type: 'NEW_MEMORY',
                data: memory
            }));
        }
    });
} 