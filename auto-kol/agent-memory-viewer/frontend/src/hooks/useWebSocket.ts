import { useEffect, useRef } from 'react';
import { useQueryClient } from 'react-query';

export function useWebSocket() {
    const wsRef = useRef<WebSocket | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
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

        return () => {
            ws.close();
        };
    }, [queryClient]);

    return wsRef.current;
} 