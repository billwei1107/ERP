/**
 * @file MainLayout.tsx
 * @description 主版面佈局 / Main Application Layout
 * @description_en Layout with sidebar and header
 * @description_zh 包含側邊欄與標頭的主佈局
 */

import React from 'react';
import './MainLayout.css';
import { Button } from '../../components/ui/button';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="erp-layout">
            <aside className="erp-sidebar">
                <div className="erp-sidebar__header">
                    <h2>ERP 管理系統</h2>
                </div>
                <nav className="erp-sidebar__nav">
                    {/* Navigation Items (To be implemented) */}
                    <div className="erp-sidebar__item active">儀表板</div>
                    <div className="erp-sidebar__item">庫存管理</div>
                    <div className="erp-sidebar__item">財務管理</div>
                </nav>
                <div className="erp-sidebar__footer">
                    <Button variant="ghost" size="sm" className="w-full">
                        登出
                    </Button>
                </div>
            </aside>

            <div className="erp-content-wrapper">
                <header className="erp-header">
                    <div className="erp-header__left">
                        <h3>儀表板</h3>
                    </div>
                    <div className="erp-header__right">
                        <Button variant="secondary" size="sm">個人設定</Button>
                    </div>
                </header>

                <main className="erp-main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};
