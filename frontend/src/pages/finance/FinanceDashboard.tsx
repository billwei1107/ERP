import { useState, useEffect } from 'react';
import { request, API_BASE_URL } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { TransactionModal } from '../../components/finance/TransactionModal';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface FinanceSummary {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
}

interface Transaction {
    id: number;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: string | { name: string };
    date: string;
    description: string;
}

interface MonthlyStat {
    month: string;
    income: number;
    expense: number;
}

export function FinanceDashboard() {
    const [summary, setSummary] = useState<FinanceSummary>({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<MonthlyStat[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

    const fetchData = async () => {
        try {
            const [summaryData, txData, statsData] = await Promise.all([
                request<FinanceSummary>('/finance/summary'),
                request<Transaction[]>('/finance/transactions'),
                request<MonthlyStat[]>('/finance/stats')
            ]);
            setSummary(summaryData);
            setTransactions(txData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to fetch finance data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Unique categories for filter
    const uniqueCategories = Array.from(new Set(transactions.map(t =>
        typeof t.category === 'object' ? t.category.name : t.category
    )));

    // Filter Logic
    const filteredTransactions = transactions.filter(tx => {
        if (filterType !== 'ALL' && tx.type !== filterType) return false;
        if (filterCategory !== 'ALL') {
            const catName = typeof tx.category === 'object' ? tx.category.name : tx.category;
            if (catName !== filterCategory) return false;
        }
        return true;
    });

    // Import / Export
    const handleExport = () => {
        window.open(`${API_BASE_URL}/finance/export?format=xlsx`, '_blank');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE_URL}/finance/import`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                alert('匯入成功');
                fetchData();
            } else {
                alert('匯入失敗');
            }
        } catch (err) {
            console.error(err);
            alert('匯入發生錯誤');
        }
        e.target.value = '';
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">財務管理 (Financial Management)</h1>
                {/* Button moved to toolbar */}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 font-medium">總收入 (Total Income)</h3>
                    <p className="text-2xl font-bold text-green-600">${summary.totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                    <h3 className="text-gray-500 font-medium">總支出 (Total Expense)</h3>
                    <p className="text-2xl font-bold text-red-600">${summary.totalExpense.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 font-medium">淨利 (Net Profit)</h3>
                    <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ${summary.netProfit.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Charts Section - Recharts Line Chart */}
            <div className="bg-white p-6 rounded-lg shadow h-[400px]">
                <h2 className="font-semibold mb-4">月度收支趨勢 (Monthly Trends - Line Chart)</h2>
                {stats.length > 0 ? (
                    <div className="w-full overflow-x-auto">
                        <LineChart
                            width={1000}
                            height={350}
                            data={stats as any}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                            <Legend />
                            <Line type="monotone" dataKey="income" name="收入 (Income)" stroke="#16a34a" activeDot={{ r: 8 }} strokeWidth={2} />
                            <Line type="monotone" dataKey="expense" name="支出 (Expense)" stroke="#dc2626" activeDot={{ r: 8 }} strokeWidth={2} />
                        </LineChart>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">暫無圖表數據</div>
                )}
            </div>

            {/* Transaction Toolbar & List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="font-semibold text-lg">最近收支 (Recent Transactions)</h2>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Filters */}
                        <select
                            className="p-2 border rounded text-sm bg-white"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                        >
                            <option value="ALL">所有類型 (All Types)</option>
                            <option value="INCOME">收入 (Income)</option>
                            <option value="EXPENSE">支出 (Expense)</option>
                        </select>

                        <select
                            className="p-2 border rounded text-sm bg-white"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="ALL">所有分類 (All Categories)</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>


                        {/* Add Button moved here */}
                        <div className="border-l pl-2 ml-2 flex gap-2">
                            <Button variant="outline" onClick={handleExport}>匯出收支</Button>
                            <Button variant="outline" onClick={() => window.open(`${API_BASE_URL}/finance/template`, '_blank')}>下載範本</Button>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".xlsx,.csv"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleImport}
                                />
                                <Button variant="outline">匯入</Button>
                            </div>
                        </div>

                        <Button onClick={() => setIsModalOpen(true)} className="ml-2">
                            + 記帳
                        </Button>
                    </div>
                </div>

                {/* Scrollable List Container */}
                <div className="overflow-y-auto max-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">日期</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">類型</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">分類</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">備註</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50">金額</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {tx.type === 'INCOME' ? '收入' : '支出'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {typeof tx.category === 'object' ? tx.category.name : tx.category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.description}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            無符合條件紀錄
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
            />
        </div >
    );
}
