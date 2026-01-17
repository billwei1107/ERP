import { useState, useEffect } from 'react';
import { request } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';


interface AttendanceRecord {
    id: number;
    userId: number;
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    time: string;
    date: string;
}

interface AttendanceResponse {
    data: AttendanceRecord[];
    total: number;
}

export function MyAttendance() {
    const { user } = useAuth();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (user) loadRecords();
    }, [user, year, month, page]);

    const loadRecords = async () => {
        if (!user) return;
        try {
            const queryParams = new URLSearchParams({
                userId: user.id.toString(),
                year: year.toString(),
                month: month.toString(),
                page: page.toString(),
                limit: '15'
            });

            const response = await request<AttendanceResponse>(`/attendance/month?${queryParams}`);

            setRecords(response.data);
            setTotalPages(Math.ceil(response.total / 15));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">我的考勤</h2>

                <div className="flex gap-2">
                    <select
                        value={year}
                        onChange={e => {
                            setYear(+e.target.value);
                            setPage(1);
                        }}
                        className="p-2 border rounded"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y}>{y}年</option>
                        ))}
                    </select>
                    <select
                        value={month}
                        onChange={e => {
                            setMonth(+e.target.value);
                            setPage(1);
                        }}
                        className="p-2 border rounded"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{m}月</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card overflow-hidden mb-4">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3">日期</th>
                            <th className="p-3">時間</th>
                            <th className="p-3">類型</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length > 0 ? (
                            records.map(r => (
                                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
                                    <td className="p-3">{new Date(r.time).toLocaleTimeString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${r.type === 'CLOCK_IN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {r.type === 'CLOCK_IN' ? '上班' : '下班'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-500">
                                    本月尚無打卡紀錄
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                        上一頁
                    </button>
                    <span className="text-gray-600">
                        第 {page} 頁 / 共 {totalPages} 頁
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                        下一頁
                    </button>
                </div>
            )}
        </div>
    );
}
