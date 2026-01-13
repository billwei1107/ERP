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

import { useAuth } from '../../lib/auth-context';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [account, setAccount] = useState('admin@erp.com'); // Default for demo
    const [password, setPassword] = useState('admin123');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(account, password);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('登入失敗，請檢查帳號密碼');
        } finally {
            setIsLoading(false);
        }
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
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                    />
                    <Input
                        label="密碼"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="請輸入密碼"
                        fullWidth
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        endAdornment={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        }
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
