import { createContext, useContext, useState, ReactNode } from 'react';
import { request } from './api';

export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    STAFF = 'STAFF',
}

interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    empId: string;
}

interface AuthContextType {
    user: User | null;
    login: (empId: string, pass: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        // Persist login state
        const stored = localStorage.getItem('erp_user');
        return stored ? JSON.parse(stored) : null;
    });

    const login = async (account: string, pass: string) => {
        const data = await request<User>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ account, password: pass }),
        });
        setUser(data);
        localStorage.setItem('erp_user', JSON.stringify(data));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('erp_user');
    };

    const isAdmin = user?.role === Role.ADMIN;

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
