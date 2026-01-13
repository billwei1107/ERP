import { useState, useEffect } from 'react';
import { request } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface ProductLocationEntry {
    location: string;
    quantity: number;
}

interface Product {
    id: number;
    sku: string;
    name: string;
    totalStock: number;
    unit: string;
    locations: ProductLocationEntry[];
}

interface StockMovement {
    id: number;
    productId: number;
    productName?: string;
    sku?: string;
    type: 'IN' | 'OUT' | 'TRANSFER';
    quantity: number;
    fromLocation?: string;
    toLocation?: string;
    reason?: string;
    date: string;
}

export function InventoryMovements() {
    const [products, setProducts] = useState<Product[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [activeTab, setActiveTab] = useState<'IN' | 'OUT' | 'TRANSFER'>('IN');

    // Form State
    const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [reason, setReason] = useState('');
    const [fromLocation, setFromLocation] = useState('');
    const [toLocation, setToLocation] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [prods, moves] = await Promise.all([
                request<Product[]>('/inventory/products'),
                request<StockMovement[]>('/inventory/movements')
            ]);
            setProducts(prods);
            setMovements(moves);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId) return alert('請選擇商品');

        try {
            const payload: any = {
                productId: +selectedProductId,
                type: activeTab,
                quantity: +quantity,
                reason,
            };

            if (activeTab === 'IN') {
                if (!toLocation) return alert('請輸入或選擇入庫儲位');
                payload.toLocation = toLocation;
            } else if (activeTab === 'OUT') {
                if (!fromLocation) return alert('請選擇出庫儲位');
                payload.fromLocation = fromLocation;
            } else if (activeTab === 'TRANSFER') {
                if (!fromLocation) return alert('請選擇來源儲位');
                if (!toLocation) return alert('請輸入或選擇目標儲位');
                payload.fromLocation = fromLocation;
                payload.toLocation = toLocation;
            }

            await request('/inventory/movements', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            alert('操作成功');
            // Reset form
            setQuantity(1);
            setReason('');
            setFromLocation('');
            setToLocation('');
            loadData(); // Refresh list and stock
        } catch (err: any) {
            console.error(err);
            alert('操作失敗: ' + (err.message || '未知錯誤'));
        }
    };

    // Derived helpers
    const selectedProduct = products.find(p => p.id === +selectedProductId);
    const availableLocations = selectedProduct?.locations || [];

    return (
        <div style={{ padding: '1.5rem' }}>
            <h2 className="text-2xl font-bold mb-6">庫存異動</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Action Form */}
                <div className="md:col-span-1 space-y-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md ${activeTab === 'IN' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('IN')}
                        >
                            入庫 (IN)
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md ${activeTab === 'OUT' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('OUT')}
                        >
                            出庫 (OUT)
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md ${activeTab === 'TRANSFER' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('TRANSFER')}
                        >
                            調撥 (TF)
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="card p-4 space-y-4 bg-white rounded-lg border">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">選擇商品</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={selectedProductId}
                                onChange={e => { setSelectedProductId(+e.target.value); setFromLocation(''); setToLocation(''); }}
                                required
                            >
                                <option value="">-- 請選擇 --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.sku} - {p.name} (總量: {p.totalStock} {p.unit})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Location Selectors based on Type */}

                        {(activeTab === 'OUT' || activeTab === 'TRANSFER') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">來源儲位 (From)</label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={fromLocation}
                                    onChange={e => setFromLocation(e.target.value)}
                                    required
                                >
                                    <option value="">-- 請選擇來源 --</option>
                                    {availableLocations.map(l => (
                                        <option key={l.location} value={l.location}>
                                            {l.location} (剩餘: {l.quantity})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {(activeTab === 'IN' || activeTab === 'TRANSFER') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">目標儲位 (To)</label>
                                <div className="flex gap-2">
                                    <input
                                        list="location-list"
                                        className="w-full p-2 border rounded-md"
                                        value={toLocation}
                                        onChange={e => setToLocation(e.target.value)}
                                        placeholder="輸入或選擇儲位"
                                        required
                                    />
                                    {/* Datalist for suggestion but allow free text */}
                                    <datalist id="location-list">
                                        {availableLocations.map(l => <option key={l.location} value={l.location} />)}
                                    </datalist>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {activeTab === 'TRANSFER' ? '移動數量' : activeTab === 'IN' ? '入庫數量' : '出庫數量'}
                            </label>
                            <Input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={e => setQuantity(+e.target.value)}
                                fullWidth
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">備註 / 原因</label>
                            <Input
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder={activeTab === 'IN' ? '例如: PO-20240101 進貨' : '例如: SO-20240101 出貨'}
                                fullWidth
                            />
                        </div>

                        <Button type="submit" className="w-full" variant={activeTab === 'OUT' ? 'destructive' : 'primary'}>
                            確認{activeTab === 'IN' ? '入庫' : activeTab === 'TRANSFER' ? '調撥' : '出庫'}
                        </Button>
                    </form>
                </div>

                {/* Right: History Table */}
                <div className="md:col-span-2">
                    <div className="card overflow-hidden h-full">
                        <div className="p-4 border-b bg-gray-50 font-medium">最近異動紀錄</div>
                        <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b sticky top-0">
                                    <tr>
                                        <th className="p-3">時間</th>
                                        <th className="p-3">類型</th>
                                        <th className="p-3">商品</th>
                                        <th className="p-3">數量</th>
                                        <th className="p-3">儲位變更</th>
                                        <th className="p-3">備註</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.length > 0 ? movements.map(m => (
                                        <tr key={m.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 text-gray-500 whitespace-nowrap">
                                                {new Date(m.date).toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${m.type === 'IN' ? 'bg-blue-100 text-blue-700' :
                                                    m.type === 'OUT' ? 'bg-red-100 text-red-700' :
                                                        'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {m.type === 'IN' ? '入庫' : m.type === 'OUT' ? '出庫' : '調撥'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium">{m.productName}</div>
                                                <div className="text-xs text-gray-500">{m.sku}</div>
                                            </td>
                                            <td className="p-3 font-mono font-bold">
                                                {m.type === 'OUT' ? '-' : '+'}{m.quantity}
                                            </td>
                                            <td className="p-3 text-xs">
                                                {m.type === 'IN' && <span className="text-green-600">➔ {m.toLocation}</span>}
                                                {m.type === 'OUT' && <span className="text-red-600">{m.fromLocation} ➔</span>}
                                                {m.type === 'TRANSFER' && <span className="text-purple-600">{m.fromLocation} ➔ {m.toLocation}</span>}
                                            </td>
                                            <td className="p-3 text-gray-600 text-xs">
                                                {m.reason || '-'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-500">尚無異動紀錄</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
