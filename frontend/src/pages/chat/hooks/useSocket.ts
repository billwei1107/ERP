import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';

export const useSocket = () => {
    const { user } = useAuth();
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Determine Protocol (ws or wss)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.PROD ? window.location.host : 'localhost:8081';
        const wsUrl = import.meta.env.PROD
            ? `${protocol}//${host}/ws?userId=${user.id}`
            : `ws://localhost:8081/ws?userId=${user.id}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            // Reconnect logic could go here (e.g. timeout and retry)
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        // Bridge raw messages to a custom event emitter flow or just expose interface
        // For simplicity, we assign to ref and let components add listeners if they want,
        // but standard way is to genericize.

        // However, existing ChatPage uses socket.on('event'). 
        // We'll mock that behavior slightly to minimize ChatPage refactor.
        // Actually, let's just expose the raw WS and refactor ChatPage to use it properly.

        socketRef.current = ws;

        return () => {
            ws.close();
        };
    }, [user]);

    // Adapter to mimic socket.io interface slightly or just return raw
    return { socket: socketRef.current, isConnected };
};
