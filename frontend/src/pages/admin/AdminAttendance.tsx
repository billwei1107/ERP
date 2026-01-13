import { useState, useEffect } from 'react';
import { request } from '../../lib/api';

interface AttendanceRecord {
    id: number;
    userId: number;
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    time: string;
    date: string;
}

export function AdminAttendance() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        loadRecords();
    }, [year, month]);

    const loadRecords = async () => {
        try {
            // Fetch for all users (no userId param)
            const data = await request<AttendanceRecord[]>(`/attendance/month?year=${year}&month=${month}`);
            setRecords(data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">全體考勤紀錄</h2>

                <div className="flex gap-2">
                    <select
                        value={year}
                        onChange={e => setYear(+e.target.value)}
                        className="p-2 border rounded"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y}>{y}年</option>
                        ))}
                    </select>
                    <select
                        value={month}
                        onChange={e => setMonth(+e.target.value)}
                        className="p-2 border rounded"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{m}月</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3">紀錄 ID</th>
                            <th className="p-3">用戶 ID</th>
                            <th className="p-3">類型</th>
                            <th className="p-3">打卡時間</th>
                            <th className="p-3">日期</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length > 0 ? (
                            records.map(r => (
                                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3">#{r.id}</td>
                                    <td className="p-3">User {r.userId}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${r.type === 'CLOCK_IN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {r.type === 'CLOCK_IN' ? '上班' : '下班'}
                                        </span>
                                    </td>
                                    <td className="p-3">{new Date(r.time).toLocaleTimeString()}</td>
                                    <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    本月尚無打卡紀錄
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
