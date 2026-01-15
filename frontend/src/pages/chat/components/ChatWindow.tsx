import React, { useState } from 'react';
import './ChatWindow.css';
import { Button } from '../../../components/ui/button';

import { ChatUser, ChatMessage } from '../services/chat.service';

interface ChatWindowProps {
    selectedUser?: ChatUser;
    messages: ChatMessage[];
    onSendMessage: (content: string) => void;
    currentUserId: number;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ selectedUser, messages, onSendMessage, currentUserId }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        onSendMessage(newMessage);
        setNewMessage('');
    };

    if (!selectedUser) {
        return (
            <div className="chat-window-empty">
                <div className="empty-state-content">
                    <div className="empty-icon">💬</div>
                    <h3>Select a conversation</h3>
                    <p>Choose a user from the sidebar to start chatting</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-window-container">
            <div className="chat-header">
                <div className="chat-header-user">
                    <div className="chat-user-avatar">
                        {selectedUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="chat-user-details">
                        <div className="chat-user-name">{selectedUser.name}</div>

                    </div>
                </div>
                <div className="chat-header-actions">
                    <Button variant="ghost" size="sm">Options</Button>
                </div>
            </div>

            <div className="chat-messages">
                {messages.map(msg => {
                    const isSelf = msg.senderId === currentUserId;
                    return (
                        <div key={msg.id} className={`message-bubble-wrapper ${isSelf ? 'self' : 'other'}`}>
                            {isSelf ? (
                                <>
                                    <div className="message-time">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="message-bubble">
                                        {msg.content}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="message-bubble">
                                        {msg.content}
                                    </div>
                                    <div className="message-time">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <form onSubmit={handleSendMessage} className="chat-input-form">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="chat-input"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button type="submit" className="send-button">
                        Send
                    </Button>
                </form>
            </div>
        </div>
    );
};
