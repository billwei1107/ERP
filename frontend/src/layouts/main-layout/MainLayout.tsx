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

    return (
        <div className="erp-layout">
            <aside className={`erp-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                <div className="erp-sidebar__header">
                    <h2>ERP 管理系統</h2>
                    <div style={{ marginTop: '0.25rem', marginLeft: '0.25rem' }}>
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
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/chat')}
                    >
                        即時通訊
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
