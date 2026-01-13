import React, { useState } from 'react';
import './UserList.css';

// import { User } from '../services/chat.service'; // We will define User interface or import it
import { ChatUser } from '../services/chat.service';

interface UserListProps {
    users: ChatUser[];
    onSelectUser: (user: ChatUser) => void;
    selectedUserId?: number;
}

export const UserList: React.FC<UserListProps> = ({ users, onSelectUser, selectedUserId }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="user-list-container">
            <div className="user-list-header">
                <h3>Messages</h3>
                <input
                    type="text"
                    placeholder="Search users..."
                    className="user-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="user-list-items">
                {filteredUsers.map(user => (
                    <div
                        key={user.id}
                        className={`user-item ${selectedUserId === user.id ? 'active' : ''}`}
                        onClick={() => onSelectUser(user)}
                    >
                        <div className={`user-avatar ${user.status}`}>
                            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-last-message">{user.lastMessage}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
