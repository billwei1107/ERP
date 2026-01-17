import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Connect to NestJS Gateway (Port 3000 mapped to 8080 via Nginx, or direct)
        // Check VITE proxy or ENV. Assuming /api maps to backend.
        // Actually, Nginx maps /ws to Chat Service (Go). 
        // We want /api/socket.io

        // Development Local: localhost:3000 (if no nginx) or localhost:8080
        // Production: Window.location.host

        let url = '';
        const path = '/api/socket.io'; // Standard Socket.IO path via Nginx proxy

        if (import.meta.env.PROD) {
            // Production: Connect to same host, Nginx handles /api/socket.io
            url = `${window.location.protocol}//${window.location.host}/chat`; // Namespace /chat
        } else {
            // Development: Usually running on localhost:5173, backend on 3000.
            // If checking against remote server (54.255.186.244), we need that IP.
            // But normally dev connects to localhost backend OR remote.
            // Let's assume user connects to Remote Backend via Proxy in vite.config
            // OR checks env.
            // Given mobile uses 54.255.186.244:8080, let's try to match.
            // But browser prevents mixed content/CORS unless configured.

            // If user is running npm run dev locally, they might be pointing to localhost:3000
            // socket = io('http://localhost:3000/chat')

            // Let's use relative path if proxy is set up, otherwise hardcode
            // Ideally use env var VITE_API_URL
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            // socket.io-client handles URL parsing.
            // If apiUrl is http://54.255...:8080, we append /chat
            url = `${apiUrl}/chat`;
        }

        // Override for this specific user case:
        // They run npm run dev locally but backend is 54...
        // Wait, mobile connects to 54...
        // Web: "npm run dev ... running for 8h".
        // Let's assume standard Vite proxy setup for /api -> Backend.
        // So we can connect to '/' (current host) and path /api/socket.io?
        // No, current host is localhost:5173.

        // Let's try explicit URL based on user behavior
        // They want "sync between app and website".
        // Mobile uses http://54.255.186.244:8080/chat
        // Web should probably use same.

        const socket = io('http://54.255.186.244:8080/chat', {
            path: '/api/socket.io',
            transports: ['websocket'],
            query: { userId: user.id },
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('Socket.IO connected');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
            setIsConnected(false);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [user]);

    return { socket: socketRef.current, isConnected };
};
