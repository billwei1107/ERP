import { useState, useEffect } from 'react';
import { request } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface StockTakeItem {
    productId: number;
    productName: string;
    sku: string;
    systemStock: number;
    actualStock: number;
    difference: number;
    location?: string;
}

interface StockTake {
    id: number;
    date: string;
    status: 'IN_PROGRESS' | 'COMPLETED';
    items: StockTakeItem[];
    note?: string;
    targetLocations?: string[];
}

export function StockTaking() {
    const [stockTakes, setStockTakes] = useState<StockTake[]>([]);
    const [activeTake, setActiveTake] = useState<StockTake | null>(null); // The one currently being edited
    const [isViewing, setIsViewing] = useState(false); // Just viewing a past one

    // Creation Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newTakeNote, setNewTakeNote] = useState('');
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [products, setProducts] = useState<any[]>([]); // Need products to get locations

    // Detail View State
    const [viewLocationFilter, setViewLocationFilter] = useState('');

    useEffect(() => {
        loadStockTakes();
        loadProducts();
    }, []);

    const loadStockTakes = async () => {
        try {
            const data = await request<StockTake[]>('/inventory/stock-takes');
            setStockTakes(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadProducts = async () => {
        try {
            const data = await request<any[]>('/inventory/products');
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    // Derived unique locations
    const locations = Array.from(new Set(products.flatMap(p => p.locations?.map((l: any) => l.location) || []))).filter(Boolean) as string[];

    const toggleLocationSelection = (loc: string) => {
        if (selectedLocations.includes(loc)) {
            setSelectedLocations(selectedLocations.filter(l => l !== loc));
        } else {
            setSelectedLocations([...selectedLocations, loc]);
        }
    };

    const handleCreateSubmit = async () => {
        try {
            const payload: any = { note: newTakeNote };
            if (selectedLocations.length > 0) {
                payload.targetLocations = selectedLocations;
            }

            const newTake = await request<StockTake>('/inventory/stock-takes', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            await loadStockTakes();
            setCreateModalOpen(false);
            setNewTakeNote('');
            setSelectedLocations([]);
            openStockTake(newTake, false);
        } catch (err) {
            console.error(err);
            alert('建立盤點單失敗: ' + (err instanceof Error ? err.message : String(err)));
        }
    };

    const openStockTake = (take: StockTake, readonly: boolean) => {
        // Deep copy items to avoid mutating state directly before save
        setActiveTake({ ...take, items: JSON.parse(JSON.stringify(take.items)) });
        setIsViewing(readonly || take.status === 'COMPLETED');
        setViewLocationFilter(''); // Reset filter on open
    };

    const handleActualChange = (productId: number, val: string) => {
        if (!activeTake) return;
        const newItems = activeTake.items.map(item => {
            if (item.productId === productId) {
                const actual = parseInt(val) || 0;
                return { ...item, actualStock: actual, difference: actual - item.systemStock };
            }
            return item;
        });
        setActiveTake({ ...activeTake, items: newItems });
    };

    const handleSubmit = async () => {
        if (!activeTake || !confirm('確定要提交盤點結果嗎？這將會更新系統庫存。')) return;

        try {
            await request(`/inventory/stock-takes/${activeTake.id}/submit`, {
                method: 'POST',
                body: JSON.stringify({ items: activeTake.items })
            });
            alert('盤點完成，庫存已更新');
            setActiveTake(null);
            loadStockTakes();
        } catch (err) {
            console.error(err);
            alert('提交失敗');
        }
    };

    // Calculate available locations in the active take for filtering
    const activeTakeLocations = activeTake
        ? Array.from(new Set(activeTake.items.map(i => i.location || 'Unknown'))).sort()
        : [];

    const displayedItems = activeTake
        ? activeTake.items.filter(item => !viewLocationFilter || item.location === viewLocationFilter)
        : [];

    return (
        <div style={{ padding: '1.5rem' }}>
            {!activeTake ? (
                // List View
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">庫存盤點</h2>
                        <Button onClick={() => setCreateModalOpen(true)}>+ 建立盤點單</Button>
                    </div>

                    <div className="card overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3">盤點單號</th>
                                    <th className="p-3">日期</th>
                                    <th className="p-3">範圍</th>
                                    <th className="p-3">狀態</th>
                                    <th className="p-3">備註</th>
                                    <th className="p-3">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockTakes.length > 0 ? stockTakes.map(st => (
                                    <tr key={st.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3 font-mono">#{st.id}</td>
                                        <td className="p-3">{new Date(st.date).toLocaleString()}</td>
                                        <td className="p-3">
                                            {/* @ts-ignore */}
                                            {(st.targetLocations && st.targetLocations.length > 0)
                                                ? <span className="text-blue-600 font-bold">{st.targetLocations.join(', ')}</span>
                                                // @ts-ignore
                                                : (st.locationFilter ? <span className="text-blue-600 font-bold">{st.locationFilter}</span> : '全庫存')
                                            }
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${st.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {st.status === 'COMPLETED' ? '已完成' : '進行中'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500">{st.note || '-'}</td>
                                        <td className="p-3">
                                            <Button size="sm" variant="outline" onClick={() => openStockTake(st, st.status === 'COMPLETED')}>
                                                {st.status === 'COMPLETED' ? '查看詳情' : '繼續盤點'}
                                            </Button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">尚無盤點紀錄</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {createModalOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">
                                <h3 className="text-lg font-bold">建立新盤點單</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">盤點備註</label>
                                    <Input
                                        value={newTakeNote}
                                        onChange={e => setNewTakeNote(e.target.value)}
                                        placeholder="例如: 月底例行盤點"
                                        fullWidth
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">選擇盤點儲位 (可多選)</label>
                                    <div className="max-h-40 overflow-y-auto border rounded p-2 text-sm space-y-1">
                                        {locations.length > 0 ? locations.map(l => (
                                            <label key={l} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLocations.includes(l)}
                                                    onChange={() => toggleLocationSelection(l)}
                                                    className="rounded border-gray-300"
                                                />
                                                <span>{l}</span>
                                            </label>
                                        )) : (
                                            <p className="text-gray-400 text-center py-2">無可用儲位</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {selectedLocations.length === 0 ? '未選擇: 預設為全庫存盤點' : `已選擇 ${selectedLocations.length} 個儲位`}
                                    </p>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>取消</Button>
                                    <Button onClick={handleCreateSubmit}>建立</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                // Detail/Edit View
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div>
                                <Button variant="ghost" size="sm" onClick={() => setActiveTake(null)} className="mb-2">← 返回列表</Button>
                                <h2 className="text-2xl font-bold">盤點單 #{activeTake.id}</h2>
                                <p className="text-sm text-gray-500">
                                    建立時間: {new Date(activeTake.date).toLocaleString()}
                                    {/* @ts-ignore */}
                                    {(activeTake.targetLocations && activeTake.targetLocations.length > 0) && (
                                        <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                            {/* @ts-ignore */}
                                            {activeTake.targetLocations.join(', ')}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* In-page Filter */}
                            {activeTakeLocations.length > 0 && (
                                <div className="ml-8 border-l pl-8">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">顯示過濾:</label>
                                    <select
                                        className="p-2 border rounded-md text-sm min-w-[150px]"
                                        value={viewLocationFilter}
                                        onChange={e => setViewLocationFilter(e.target.value)}
                                    >
                                        <option value="">全部儲位 ({activeTake.items.length})</option>
                                        {activeTakeLocations.map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {!isViewing && (
                            <Button onClick={handleSubmit}>提交盤點結果</Button>
                        )}
                    </div>

                    <div className="card overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3">商品 SKU</th>
                                    <th className="p-3">名稱</th>
                                    <th className="p-3">儲位</th>
                                    <th className="p-3 text-right">系統庫存</th>
                                    <th className="p-3 w-32">實盤數量</th>
                                    <th className="p-3 text-right">差異</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedItems.map(item => (
                                    <tr key={`${item.productId}-${item.location}`} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3 font-mono">{item.sku}</td>
                                        <td className="p-3 font-medium">{item.productName}</td>
                                        <td className="p-3 text-gray-500">{item.location || '-'}</td>
                                        <td className="p-3 text-right text-gray-600">{item.systemStock}</td>
                                        <td className="p-3">
                                            {isViewing ? (
                                                <span className="font-bold">{item.actualStock}</span>
                                            ) : (
                                                <Input
                                                    type="number"
                                                    value={item.actualStock}
                                                    onChange={e => handleActualChange(item.productId, e.target.value)}
                                                    className="w-full text-center"
                                                />
                                            )}
                                        </td>
                                        <td className={`p-3 text-right font-bold ${item.difference === 0 ? 'text-gray-400' :
                                            item.difference > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {item.difference > 0 ? '+' : ''}{item.difference}
                                        </td>
                                    </tr>
                                ))}
                                {displayedItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            此範圍內無商品資料
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
