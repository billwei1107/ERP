/**
 * @file App.tsx
 * @description 應用程式路由配置 / Main Application Routes
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/main-layout';
import { LoginPage } from './pages/login';
import { ProtectedRoute } from './lib/protected-route';
import { DashboardPage } from './pages/dashboard';
import { AccountManagement, AdminAttendance } from './pages/admin';
import { MyAttendance } from './pages/attendance/MyAttendance';
// import { ProductManagement } from './pages/inventory/ProductManagement';
// import { InventoryMovements } from './pages/inventory/InventoryMovements';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { FinanceDashboard } from './pages/finance/FinanceDashboard';
import { ProfileSettings } from './pages/settings/ProfileSettings';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout>
                            <DashboardPage />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin/accounts" element={
                    <ProtectedRoute>
                        <MainLayout>
                            <AccountManagement />
                        </MainLayout>
                    </ProtectedRoute>
                } />
                <Route path="/admin/attendance" element={
                    <ProtectedRoute>
                        <MainLayout>
                            <AdminAttendance />
                        </MainLayout>
                    </ProtectedRoute>
                } />
                <Route path="/my-attendance" element={
                    <ProtectedRoute>
                        <MainLayout>
                            <MyAttendance />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                {/* Inventory Routes */}
                <Route path="/inventory" element={
                    <ProtectedRoute>
                        <MainLayout>
                            <InventoryPage />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                {/* Finance Routes */}
                <Route path="/finance" element={
                    <ProtectedRoute>
                        <MainLayout>
                            <FinanceDashboard />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                {/* Settings Routes */}
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <MainLayout>
                            <ProfileSettings />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                {/* Redirect unknown routes to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
