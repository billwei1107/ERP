import { request } from '../../../lib/api';

export interface ChatUser {
    id: number;
    name: string;
    role: string;
    avatar?: string;
    status: 'online' | 'offline';
    lastMessage?: string;
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
        // TODO: This should be a real API call. 
        // For now, we reuse the existing mock structure but fetch from a real endpoint if available
        // We will create a new endpoint in Backend: /users/chat-list
        return request<ChatUser[]>('/users');
    },

    getHistory: async (otherUserId: number) => {
        // We need the current user ID. 
        // The API is /chat/history/:userId/:otherUserId
        // We can get userId from localStorage 'erp_user' since this is a static service
        // Or we pass it as arg. Let's rely on AuthContext if we could, but here:
        const stored = localStorage.getItem('erp_user');
        const userId = stored ? JSON.parse(stored).id : 0;

        return request<ChatMessage[]>(`/chat/history/${userId}/${otherUserId}`);
    }
};
