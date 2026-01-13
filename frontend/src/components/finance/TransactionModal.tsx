import { useState, useEffect } from 'react';
import { request } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function TransactionModal({ isOpen, onClose, onSuccess }: TransactionModalProps) {
    const [categories, setCategories] = useState<{ id: number, name: string, type: 'INCOME' | 'EXPENSE' }[]>([]);
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            request<{ id: number, name: string, type: 'INCOME' | 'EXPENSE' }[]>('/finance/categories')
                .then(setCategories)
                .catch(console.error);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await request('/finance/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    type,
                    amount: Number(amount),
                    category,
                    date,
                    description
                })
            });
            onSuccess();
            onClose();
            // Reset form
            setAmount('');
            setDescription('');
        } catch (error) {
            alert('Failed to save transaction');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredCategories = categories.filter(c => c.type === type);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">記帳 (Record Transaction)</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant={type === 'EXPENSE' ? 'primary' : 'outline'}
                            onClick={() => setType('EXPENSE')}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            支出 (Expense)
                        </Button>
                        <Button
                            type="button"
                            variant={type === 'INCOME' ? 'primary' : 'outline'}
                            onClick={() => setType('INCOME')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                            收入 (Income)
                        </Button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">日期 (Date)</label>
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">金額 (Amount)</label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">分類 (Category)</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        >
                            <option value="">選擇分類...</option>
                            {filteredCategories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">備註 (Description)</label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>取消</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? '儲存中...' : '儲存'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
