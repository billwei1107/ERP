import React, { useState, useEffect } from 'react';
import { UserList } from './components/UserList';
import { ChatWindow } from './components/ChatWindow';
import './ChatPage.css';
import { useAuth } from '../../lib/auth-context';
import { chatService, ChatUser, ChatMessage } from './services/chat.service';
import { useSocket } from './hooks/useSocket';

export const ChatPage: React.FC = () => {
    const { user } = useAuth();
    const { socket } = useSocket();

    const [users, setUsers] = useState<ChatUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | undefined>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Fetch users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await chatService.getUsers();
                const processed = data.map(u => ({
                    ...u,
                    avatar: u.avatar || u.name.substring(0, 2).toUpperCase(),
                    status: 'offline' as const
                })).filter(u => u.id !== user?.id);
                setUsers(processed);
            } catch (error) {
                console.error('Failed to load users', error);
            }
        };
        fetchUsers();
    }, [user]);

    // Fetch history when selecting user
    useEffect(() => {
        if (!selectedUser || !user) return;

        const loadHistory = async () => {
            try {
                const history = await chatService.getHistory(selectedUser.id);
                setMessages(history);
            } catch (error) {
                console.error('Failed to load history', error);
            }
        };
        loadHistory();
    }, [selectedUser, user]);

    // Socket listener for new messages
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (msg: ChatMessage) => {
            // Handle Chat Messages
            const isRelevant =
                (selectedUser && msg.senderId === selectedUser.id) ||
                (selectedUser && msg.senderId === user?.id && msg.receiverId === selectedUser.id);

            if (isRelevant) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }

            // Update lastMessage in UserList
            setUsers(prevUsers => prevUsers.map(u => {
                const isChatPartner = (u.id === msg.senderId) || (u.id === msg.receiverId);
                if (isChatPartner) {
                    return { ...u, lastMessage: msg.content };
                }
                return u;
            }));
        };

        socket.on('receiveMessage', handleReceiveMessage);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
        };
    }, [socket, selectedUser, user]);

    const handleSendMessage = (content: string) => {
        if (!socket || !selectedUser || !user) return;

        const payload = {
            senderId: user.id,
            receiverId: selectedUser.id,
            content
        };

        // Send via Socket.IO
        socket.emit('sendMessage', payload);

        // Optimistic UI
        // Since we receive the echo back from server (via 'receiveMessage' emitted to sender room),
        // we can rely on that for final ID. But for instant feel:
        // We'll skip manual addition here and rely on the socket event which should be fast enough (~50ms)
        // If user complains about lag, we add temp message.
        // User asked for "Hot Reload" (meaning auto-update).
    };

    return (
        <div className="chat-page-container">
            <div className="chat-layout">
                <UserList
                    users={users}
                    onSelectUser={(user) => setSelectedUser(user)}
                    selectedUserId={selectedUser?.id}
                />
                <ChatWindow
                    selectedUser={selectedUser}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    currentUserId={user?.id || 0}
                />
            </div>
        </div>
    );
};
