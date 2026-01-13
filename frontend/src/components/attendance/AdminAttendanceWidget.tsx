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
        }, 3000); // Poll every 3 seconds

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
                <h3>員工打卡狀態</h3>
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
