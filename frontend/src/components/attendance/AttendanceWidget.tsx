import { useState, useEffect } from 'react';
import { request } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../ui/button';
import styles from './AttendanceWidget.module.css';

interface AttendanceRecord {
    id: number;
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    time: string;
}

interface Props {
    onSuccess?: () => void;
}

export function AttendanceWidget({ onSuccess }: Props) {
    const [status, setStatus] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const userId = user?.id || 0;

    useEffect(() => {
        if (userId) loadStatus();
    }, [userId]);

    const loadStatus = async () => {
        try {
            const data = await request<AttendanceRecord[]>(`/attendance/today?userId=${userId}`);
            setStatus(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClockIn = async () => {
        setLoading(true);
        try {
            await request('/attendance/clock-in', {
                method: 'POST',
                body: JSON.stringify({ userId }),
            });
            await loadStatus();
            onSuccess?.();
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async () => {
        setLoading(true);
        try {
            await request('/attendance/clock-out', {
                method: 'POST',
                body: JSON.stringify({ userId }),
            });
            await loadStatus();
            onSuccess?.();
        } finally {
            setLoading(false);
        }
    };

    const lastRecord = status.length > 0 ? status[status.length - 1] : null;
    const isClockedIn = lastRecord?.type === 'CLOCK_IN';

    return (
        <div className={styles.container}>
            <h3 className={styles.header}>出勤打卡</h3>
            <div className={styles.status}>
                {lastRecord ? (
                    <>
                        最後打卡: {lastRecord.type === 'CLOCK_IN' ? '上班' : '下班'} @{' '}
                        {new Date(lastRecord.time).toLocaleTimeString()}
                    </>
                ) : (
                    '尚未打卡'
                )}
            </div>

            <div className={styles.actions}>
                <Button
                    onClick={handleClockIn}
                    disabled={loading || isClockedIn}
                    className={styles.btnCheckIn}
                >
                    上班打卡
                </Button>
                <Button
                    onClick={handleClockOut}
                    disabled={loading || !isClockedIn}
                    className={styles.btnCheckOut}
                >
                    下班打卡
                </Button>
            </div>
        </div>
    );
}
