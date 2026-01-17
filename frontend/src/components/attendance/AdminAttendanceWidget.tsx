import { useState, useEffect } from 'react';
import { request } from '../../lib/api';
import styles from './AdminAttendanceWidget.module.css';

interface User {
    id: number;
    name: string;
    empId: string;
}

interface AttendanceRecord {
    userId: number;
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    time: string;
}

interface UserStatus {
    user: User;
    lastRecord: AttendanceRecord | null;
}

export const AdminAttendanceWidget = ({ refreshTrigger }: { refreshTrigger?: number }) => {
    const [statuses, setStatuses] = useState<UserStatus[]>([]);

    useEffect(() => {
        loadData();

        const interval = setInterval(() => {
            loadData();
        }, 15000); // Poll every 15 seconds (Optimized from 3s)

        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const loadData = async () => {
        try {
            const [users, records] = await Promise.all([
                request<User[]>('/users'),
                request<AttendanceRecord[]>('/attendance/all')
            ]);

            const statusList = users.map(user => {
                const userRecords = records
                    .filter(r => r.userId === user.id)
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

                return {
                    user,
                    lastRecord: userRecords.length > 0 ? userRecords[0] : null
                };
            });

            setStatuses(statusList);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div className="flex items-center gap-2">
                    <h3>員工打卡狀態</h3>
                    <button
                        onClick={() => loadData()}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="重新整理"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg>
                    </button>
                </div>
                <span className={styles.badge}>{statuses.filter(s => s.lastRecord?.type === 'CLOCK_IN').length} 人在勤</span>
            </div>
            <div className={styles.list}>
                {statuses.map(({ user, lastRecord }) => (
                    <div key={user.id} className={styles.item}>
                        <div className={styles.userInfo}>
                            <span className={styles.empId}>{user.empId}</span>
                            <span className={styles.name}>{user.name}</span>
                        </div>
                        <div className={styles.status}>
                            {lastRecord ? (
                                <>
                                    <span className={`${styles.statusDot} ${lastRecord.type === 'CLOCK_IN' ? styles.online : styles.offline}`} />
                                    <span className={styles.time}>{new Date(lastRecord.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className={styles.type}>{lastRecord.type === 'CLOCK_IN' ? '上班' : '下班'}</span>
                                </>
                            ) : (
                                <span className={styles.noRecord}>無紀錄</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
