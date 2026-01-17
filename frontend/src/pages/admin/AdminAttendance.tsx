import { useState, useEffect } from 'react';
import { request } from '../../lib/api';

interface AttendanceRecord {
    id: number;
    userId: number;
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    time: string;
    date: string;
    user: {
        id: number;
        name: string;
        empId: string;
    }
}

interface User {
    id: number;
    name: string;
    empId: string;
}

interface AttendanceResponse {
    data: AttendanceRecord[];
    total: number;
}

export function AdminAttendance() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    // Pagination & Filter State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>(''); // Empty string for "All"

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        loadRecords();
    }, [year, month, page, selectedUserId]);

    const loadUsers = async () => {
        try {
            const data = await request<User[]>('/users');
            setUsers(data);
        } catch (err) {
            console.error('Failed to load users', err);
        }
    }

    const loadRecords = async () => {
        try {
            const queryParams = new URLSearchParams({
                year: year.toString(),
                month: month.toString(),
                page: page.toString(),
                limit: '15',
                ...(selectedUserId ? { userId: selectedUserId } : {})
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
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold">全體考勤紀錄</h2>

                <div className="flex gap-2 items-center">
                    {/* User Filter */}
                    <select
                        value={selectedUserId}
                        onChange={e => {
                            setSelectedUserId(e.target.value);
                            setPage(1); // Reset to page 1 on filter change
                        }}
                        className="p-2 border rounded"
                    >
                        <option value="">所有員工</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.empId})</option>
                        ))}
                    </select>

                    {/* Year Selector */}
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

                    {/* Month Selector */}
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
                            <th className="p-3">紀錄 ID</th>
                            <th className="p-3">姓名 (工號)</th>
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
                                    <td className="p-3">
                                        {r.user ? `${r.user.name} (${r.user.empId || '-'})` : `User ${r.userId}`}
                                    </td>
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
                                    本月尚無符合條件的打卡紀錄
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
