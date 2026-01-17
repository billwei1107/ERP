import { request } from '../../../lib/api';

export interface ChatUser {
    id: number;
    name: string;
    role: string;
    avatar?: string;
    status: 'online' | 'offline' | 'dnd';
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
}

export interface ChatMessage {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    createdAt: string;
    sender?: {
        name: string;
    };
    isSelf?: boolean;
}

export const chatService = {
    getUsers: async () => {
        // Fallback
        return request<ChatUser[]>('/users');
    },

    getChatUsers: async (myId: number) => {
        return request<ChatUser[]>(`/chat/users/${myId}`);
    },

    getHistory: async (userId: number, otherUserId: number) => {
        return request<ChatMessage[]>(`/chat/history/${userId}/${otherUserId}`);
    },

    getUnreadCount: async (userId: number) => {
        return request<{ count: number }>(`/chat/unread/${userId}`);
    },

    markAsRead: async (myId: number, otherUserId: number) => {
        const res = await request(`/chat/read/${myId}/${otherUserId}`);
        // Dispatch local event for UI to update
        window.dispatchEvent(new CustomEvent('chat:read_update', {
            detail: { userId: myId, otherUserId }
        }));
        return res;
    }
};
