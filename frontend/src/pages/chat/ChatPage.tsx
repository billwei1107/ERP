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
                // Transform data if needed, e.g. generate avatars
                const processed = data.map(u => ({
                    ...u,
                    avatar: u.avatar || u.name.substring(0, 2).toUpperCase(),
                    status: 'offline' as const // Default to offline for now
                })).filter(u => u.id !== user?.id); // Exclude self
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
            // Only append if it belongs to the current conversation
            // msg.senderId is the other person (or self if echoed)
            // msg.receiverId is self (or other if echoed)

            // If the message is from the selected user OR sent by me to the selected user
            const isRelevant =
                (selectedUser && msg.senderId === selectedUser.id) ||
                (selectedUser && msg.senderId === user?.id && msg.receiverId === selectedUser.id);

            if (isRelevant) {
                setMessages(prev => [...prev, msg]);
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

        socket.emit('sendMessage', payload);

        const tempMsg: ChatMessage = {
            id: Date.now(),
            senderId: user.id,
            receiverId: selectedUser.id,
            content,
            createdAt: new Date().toISOString(),
            isSelf: true
        };
        setMessages(prev => [...prev, tempMsg]);

        // Update lastMessage for selected user immediately
        setUsers(prevUsers => prevUsers.map(u => {
            if (u.id === selectedUser.id) {
                return { ...u, lastMessage: content };
            }
            return u;
        }));
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
