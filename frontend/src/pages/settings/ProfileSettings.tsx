import { useState, useEffect } from 'react';
import { useAuth, Role } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { request } from '../../lib/api';
import { Button } from '../../components/ui/button';
import './ProfileSettings.css';

interface UserProfile {
    id: number;
    name: string;
    email: string;
    role: Role;
    empId: string;
    avatar?: string;
    bio?: string;
    status?: string;
    themePreference?: 'light' | 'dark';
}

export function ProfileSettings() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Form States
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const data = await request<UserProfile>(`/users/${user!.id}`);
            setProfile(data);
        } catch (err) {
            console.error('Failed to load profile', err);
        }
    };

    const handleSave = async () => {
        if (!profile) return;
        setIsLoading(true);
        try {
            await request(`/users/${profile.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: profile.name,
                    bio: profile.bio,
                    status: profile.status,
                    avatar: profile.avatar,
                    themePreference: theme
                })
            });
            setMsg('Saved successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            console.error(err);
            setMsg('Failed to save.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!profile) return <div className="p-6">Loading profile...</div>;

    return (
        <div className="profile-settings">
            <h1>個人設定 (Profile Settings)</h1>

            {/* Profile Card */}
            <div className="profile-card">
                <div className="profile-header">
                    <img
                        src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}`}
                        alt="Avatar"
                        className="profile-avatar"
                    />
                    <div style={{ flex: 1 }}>
                        <div className="form-group">
                            <label className="form-label">頭像網址 (Avatar URL)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.avatar || ''}
                                onChange={e => setProfile({ ...profile, avatar: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">顯示名稱 (Display Name)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={profile.name}
                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">狀態 (Status)</label>
                        <select
                            className="form-select"
                            value={profile.status || 'ONLINE'}
                            onChange={e => setProfile({ ...profile, status: e.target.value })}
                        >
                            <option value="ONLINE">線上 (Online)</option>
                            <option value="BUSY">忙碌 (Busy)</option>
                            <option value="AWAY">離開 (Away)</option>
                            <option value="OFFLINE">離線 (Offline)</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">個人簡介 (Bio)</label>
                    <textarea
                        rows={3}
                        className="form-textarea"
                        value={profile.bio || ''}
                        onChange={e => setProfile({ ...profile, bio: e.target.value })}
                    />
                </div>

                <div className="section-divider">
                    <h3 className="section-title">外觀設定 (Appearance)</h3>
                    <div className="toggle-container">
                        <span style={{ color: 'var(--text-main)' }}>深色模式 (Dark Mode)</span>
                        <div
                            className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
                            onClick={toggleTheme}
                        >
                            <div className="toggle-knob"></div>
                        </div>
                    </div>
                </div>

                <div className="save-btn-container">
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? 'Saving...' : '儲存變更 (Save Changes)'}
                    </Button>
                </div>
                {msg && <p className="msg-text">{msg}</p>}
            </div>
        </div>
    );
}
