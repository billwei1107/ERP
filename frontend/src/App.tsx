/**
 * @file App.tsx
 * @description 應用程式路由配置 / Main Application Routes
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/main-layout';
import { LoginPage } from './pages/login';


import { DashboardPage } from './pages/dashboard';

// ... (remove old Dashboard component if possible, or just ignore it)

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route path="/" element={
                    <MainLayout>
                        <DashboardPage />
                    </MainLayout>
                } />

                {/* Redirect unknown routes to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
