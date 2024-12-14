import { useEffect, useRef } from 'react';
import { useQueryClient } from 'react-query';

export function useWebSocket() {
    const wsRef = useRef<WebSocket | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            const ws = new WebSocket('ws://localhost:3011');
            wsRef.current = ws;

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'NEW_MEMORY') {
                    queryClient.invalidateQueries('dsn');
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }

        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, [queryClient]);

    return wsRef.current;
} 