/**
 * @file MainLayout.tsx
 * @description 主版面佈局 / Main Application Layout
 * @description_en Layout with sidebar and header
 * @description_zh 包含側邊欄與標頭的主佈局
 */

import React from 'react';
import './MainLayout.css';
import { Button } from '../../components/ui/button';

import { useAuth } from '../../lib/auth-context';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../pages/chat/hooks/useSocket';
import { chatService } from '../../pages/chat/services/chat.service';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const [unreadCount, setUnreadCount] = React.useState(0);
    const { socket } = useSocket();

    React.useEffect(() => {
        if (user) {
            // Fetch initial unread count
            chatService.getUnreadCount(user.id).then(({ count }) => {
                setUnreadCount(count);
            });
        }
    }, [user]);

    React.useEffect(() => {
        if (!socket || !user) return;

        socket.on('receiveMessage', (data) => {
            if (data.receiverId === user.id) {
                // If we are not on chat page or not in that conversation... 
                // Simple logic: Increment. 
                // Ideally, if on Chat Page, Chat Page will mark as read?
                // But MainLayout doesn't know. 
                // We rely on "messagesRead" event OR simple increment.
                setUnreadCount(prev => prev + 1);
            }
        });

        // Listen for Reset event if implemented? 
        // Can be done via Custom Event or BroadCastChannel if ChatPage marks read.

        const handleReadUpdate = () => {
            chatService.getUnreadCount(user.id).then(({ count }) => {
                setUnreadCount(count);
            });
        };

        window.addEventListener('chat:read_update', handleReadUpdate);

        return () => {
            socket.off('receiveMessage');
            window.removeEventListener('chat:read_update', handleReadUpdate);
        }
    }, [socket, user]);

    // Listen to route changes to refresh count?
    React.useEffect(() => {
        if (location.pathname.startsWith('/chat') && user) {
            // Re-fetch to clear count if ChatPage marked as read
            chatService.getUnreadCount(user.id).then(({ count }) => {
                setUnreadCount(count);
            });
        }
    }, [location.pathname, user]);

    return (
        <div className="erp-layout">
            <aside className={`erp-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                <div className="erp-sidebar__header">
                    <h2>ERP 管理系統</h2>
                    <div style={{ marginTop: '0.25rem', marginLeft: '0.75rem' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{user?.role}</div>
                    </div>
                </div>
                <nav className="erp-sidebar__nav">
                    <div
                        className="erp-sidebar__item active"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    >
                        儀表板
                    </div>
                    <div
                        className={`erp-sidebar__item ${location.pathname === '/my-attendance' ? 'active' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/my-attendance')}
                    >
                        我的考勤
                    </div>
                    <div
                        className={`erp-sidebar__item ${location.pathname.startsWith('/inventory') ? 'active' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/inventory')}
                    >
                        庫存管理
                    </div>
                    <div
                        className={`erp-sidebar__item ${location.pathname.startsWith('/finance') ? 'active' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/finance')}
                    >
                        財務管理
                    </div>
                    <div
                        className={`erp-sidebar__item ${location.pathname.startsWith('/chat') ? 'active' : ''}`}
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => navigate('/chat')}
                    >
                        <span>即時通訊</span>
                        {unreadCount > 0 && (
                            <span style={{
                                backgroundColor: '#EF4444',
                                color: 'white',
                                borderRadius: '9999px',
                                padding: '0.125rem 0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: 500
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    {isAdmin && (
                        <>
                            <div
                                className="erp-sidebar__item"
                                style={{ color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
                                onClick={() => navigate('/admin/accounts')}
                            >
                                帳號管理
                            </div>
                            <div
                                className="erp-sidebar__item"
                                style={{ color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
                                onClick={() => navigate('/admin/attendance')}
                            >
                                考勤管理
                            </div>
                        </>
                    )}
                </nav>
                <div className="erp-sidebar__footer">
                    <Button variant="ghost" size="sm" className="w-full" onClick={handleLogout}>
                        登出
                    </Button>
                </div>
            </aside>

            <div className="erp-content-wrapper">
                <header className="erp-header">
                    <div className="erp-header__left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{ padding: '0.5rem' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Button>
                        <h3>儀表板</h3>
                    </div>
                    <div className="erp-header__right">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/settings')}
                        >
                            個人設定
                        </Button>
                    </div>
                </header>

                <main className="erp-main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};
