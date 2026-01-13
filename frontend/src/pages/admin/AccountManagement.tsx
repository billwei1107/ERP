import { useState, useEffect } from 'react';
import { request } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth, Role } from '../../lib/auth-context';

interface User {
    id: number;
    name: string;
    email: string;
    empId: string;
    role: Role;
}

export function AccountManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { isAdmin } = useAuth();

    useEffect(() => {
        if (isAdmin) loadUsers();
    }, [isAdmin]);

    const loadUsers = async () => {
        try {
            const data = await request<User[]>('/users');
            setUsers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({ name: user.name, email: user.email, role: user.role });
        setPassword('');
        setShowPassword(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除此用戶嗎？此動作無法復原。')) return;
        try {
            await request(`/users/${id}`, { method: 'DELETE' });
            loadUsers();
            alert('刪除成功');
        } catch (err) {
            console.error(err);
            alert('刪除失敗');
        }
    };

    const handleCreate = () => {
        setFormData({ role: Role.STAFF });
        setPassword('');
        setShowPassword(false);
        setIsCreating(true);
    };

    const handleSave = async () => {
        try {
            if (editingUser) {
                await request(`/users/${editingUser.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ ...formData, ...(password ? { password } : {}) }),
                });
                alert('更新成功');
            } else {
                await request('/users', {
                    method: 'POST',
                    body: JSON.stringify({ ...formData, password: password || 'user123' }),
                });
                alert('新增成功');
            }
            setEditingUser(null);
            setIsCreating(false);
            loadUsers();
        } catch (err) {
            console.error(err);
            alert('操作失敗');
        }
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">帳號管理</h2>
                <Button onClick={handleCreate}>+ 新增員工</Button>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3">編號</th>
                            <th className="p-3">姓名</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">權限</th>
                            <th className="p-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-3">{user.empId}</td>
                                <td className="p-3">{user.name}</td>
                                <td className="p-3">{user.email}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs ${user.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                                        編輯
                                    </Button>
                                    <Button size="sm" variant="ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(user.id)}>
                                        刪除
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {(editingUser || isCreating) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
                        <h3 className="text-lg font-bold">{isCreating ? '新增員工' : `編輯用戶: ${editingUser?.name}`}</h3>

                        <Input
                            label="姓名"
                            fullWidth
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <Input
                            label="Email"
                            fullWidth
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                        {isCreating && (
                            <Input
                                label="員工編號 (選填)"
                                placeholder="留空則自動產生，例: EMP003"
                                fullWidth
                                value={formData.empId || ''}
                                onChange={e => setFormData({ ...formData, empId: e.target.value })}
                            />
                        )}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">權限角色</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                            >
                                <option value={Role.STAFF}>STAFF</option>
                                <option value={Role.MANAGER}>MANAGER</option>
                                <option value={Role.ADMIN}>ADMIN</option>
                            </select>
                        </div>
                        <Input
                            label={isCreating ? "密碼 (預設: user123)" : "重設密碼 (若不修改請留空)"}
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            value={password}
                            onChange={e => setPassword(e.target.value)}
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

                        <div className="flex gap-2 justify-end mt-4">
                            <Button variant="ghost" onClick={() => { setEditingUser(null); setIsCreating(false); }}>取消</Button>
                            <Button onClick={handleSave}>{isCreating ? '建立用戶' : '儲存變更'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
