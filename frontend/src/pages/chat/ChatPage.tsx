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
        if (!user) return;
        const fetchUsers = async () => {
            try {
                // Fetch sorted list from backend
                const data = await chatService.getChatUsers(user.id);
                // Process avatars if needed
                const processed = data.map(u => ({
                    ...u,
                    avatar: u.avatar || u.name.substring(0, 2).toUpperCase(),
                    status: 'offline' as const
                }));
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
                const history = await chatService.getHistory(user.id, selectedUser.id);
                setMessages(history);

                // Mark as Read visually
                if (selectedUser.unreadCount && selectedUser.unreadCount > 0) {
                    // Call API
                    chatService.markAsRead(user.id, selectedUser.id);
                    // Update local state
                    setUsers(prev => prev.map(u =>
                        u.id === selectedUser.id ? { ...u, unreadCount: 0 } : u
                    ));
                }
            } catch (error) {
                console.error('Failed to load history', error);
            }
        };
        loadHistory();
    }, [selectedUser, user]);

    // Socket listener for new messages
    useEffect(() => {
        if (!socket || !user) return;

        const handleReceiveMessage = (msg: ChatMessage) => {
            // Check if relevant for current chat window
            const isRelatedToSelection = selectedUser &&
                (msg.senderId === selectedUser.id || (msg.senderId === user.id && msg.receiverId === selectedUser.id));

            if (isRelatedToSelection) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                // If I am receiving and window open, mark as read?
                // For simplicity, we assume click is needed or auto-read if window open.
                // If window open, unread count should remain 0.
            }

            // Update User List (Unread Count + Sort)
            setUsers(prevUsers => {
                const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
                const existing = prevUsers.find(u => u.id === partnerId);

                if (!existing) return prevUsers; // Or fetch user

                // Determine new Unread Count
                let newUnread = existing.unreadCount || 0;
                // Increment if I am receiver AND (not selected OR selected but window inactive?)
                // If selectedUser is this user, checking "isRelatedToSelection".
                // We should keep unread 0 if selected.
                if (msg.receiverId === user.id) {
                    if (selectedUser?.id !== partnerId) {
                        newUnread++;
                    }
                }

                const updatedUser = {
                    ...existing,
                    lastMessage: msg.content,
                    lastMessageTime: msg.createdAt, // Backend provides this? or use current time
                    unreadCount: newUnread
                };

                // Move to top
                const others = prevUsers.filter(u => u.id !== partnerId);
                return [updatedUser, ...others];
            });
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

        // Optimistic UI for Message List handled by echo or instant add?
        // Let's add instantly like Mobile
        // But backend echo (receiveMessage) will handle list update.
        // Wait, current logic relies on echo for everything.
        // Echo is fast.

        // But we WANT to move user to top instantly.
        // handleReceiveMessage will do it when echo arrives.
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
