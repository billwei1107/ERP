/**
 * @file LoginPage.tsx
 * @description 登入頁面 / Login Page
 * @description_en Authentication page with username and password login
 * @description_zh 包含帳號密碼輸入的登入頁面
 */

import React, { useState } from 'react';
import './LoginPage.css';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export const LoginPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            alert('登入功能尚未串接 API');
        }, 1500);
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>ERP 管理系統</h1>
                    <p>請輸入您的帳號與密碼以登入</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <Input
                        label="帳號"
                        placeholder="請輸入員工編號或 Email"
                        fullWidth
                        required
                    />
                    <Input
                        label="密碼"
                        type="password"
                        placeholder="請輸入密碼"
                        fullWidth
                        required
                    />

                    <div className="login-actions">
                        <label className="remember-me">
                            <input type="checkbox" />
                            <span>記住我</span>
                        </label>
                        <a href="#" className="forgot-password">忘記密碼？</a>
                    </div>

                    <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                        登入系統
                    </Button>
                </form>

                <div className="login-footer">
                    <p>© 2026 ERP System. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};
