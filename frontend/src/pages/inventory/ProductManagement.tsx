import { useState, useEffect } from 'react';
import { request, API_BASE_URL } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface ProductLocation {
    location: string;
    quantity: number;
}

interface Product {
    id: number;
    sku: string;
    name: string;
    category: string;
    unit: string;
    safetyStock: number;
    totalStock: number;
    locations: ProductLocation[];
}

export function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [summary, setSummary] = useState({ totalProducts: 0, lowStockCount: 0 });
    const [filters, setFilters] = useState({ keyword: '', category: '', location: '' });

    // Modal state
    const [isCreating, setIsCreating] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product> & { locations: ProductLocation[] }>({
        sku: '', name: '', category: '', unit: '', safetyStock: 0, locations: []
    });

    useEffect(() => {
        loadProducts();
        loadSummary();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await request<Product[]>('/inventory/products');
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadSummary = async () => {
        try {
            const data = await request<any>('/inventory/summary');
            setSummary(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = () => {
        setFormData({ safetyStock: 10, totalStock: 0, unit: '個', locations: [] });
        setIsCreating(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({ ...product });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除此商品嗎？')) return;
        try {
            await request(`/inventory/products/${id}`, { method: 'DELETE' });
            loadProducts();
            loadSummary();
        } catch (err) {
            console.error(err);
            alert('刪除失敗');
        }
    };

    const handleSave = async () => {
        try {
            if (editingProduct) {
                await request(`/inventory/products/${editingProduct.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(formData),
                });
            } else {
                await request('/inventory/products', {
                    method: 'POST',
                    body: JSON.stringify(formData),
                });
            }
            setEditingProduct(null);
            setIsCreating(false);
            loadProducts();
            loadSummary();
        } catch (err) {
            console.error(err);
            alert('儲存失敗');
        }
    };

    const handleExport = () => {
        window.open(`${API_BASE_URL}/inventory/export?format=xlsx`, '_blank');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE_URL}/inventory/import`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                alert('匯入成功');
                loadProducts();
                loadSummary();
            } else {
                alert('匯入失敗');
            }
        } catch (err) {
            console.error(err);
            alert('匯入發生錯誤');
        }
        // Reset input
        e.target.value = '';
    };

    // Derived lists for dropdowns
    const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    const locations = Array.from(new Set(products.flatMap(p => p.locations.map(l => l.location)))).filter(Boolean);

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchKeyword = !filters.keyword || (
            p.name.toLowerCase().includes(filters.keyword.toLowerCase()) ||
            p.sku.toLowerCase().includes(filters.keyword.toLowerCase())
        );
        const matchCategory = !filters.category || p.category === filters.category;
        const matchLocation = !filters.location || p.locations.some(l => l.location === filters.location);
        return matchKeyword && matchCategory && matchLocation;
    });

    return (
        <div style={{ padding: '1.5rem' }}>
            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-gray-500 text-sm font-medium">商品總數</span>
                    <span className="text-3xl font-bold text-blue-600 mt-1">{summary.totalProducts}</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-gray-500 text-sm font-medium">低庫存預警</span>
                    <span className="text-3xl font-bold text-red-600 mt-1">{summary.lowStockCount}</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-gray-500 text-sm font-medium">庫存種類</span>
                    <span className="text-3xl font-bold text-gray-800 mt-1">{categories.length}</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">商品列表</h2>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="flex-1 min-w-[150px]">
                        <Input
                            placeholder="搜尋 SKU 或 名稱..."
                            value={filters.keyword}
                            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                            fullWidth
                        />
                    </div>
                    <select
                        className="border rounded-md px-3 py-2 text-sm min-w-[120px]"
                        value={filters.category}
                        onChange={e => setFilters({ ...filters, category: e.target.value })}
                    >
                        <option value="">所有分類</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                        className="border rounded-md px-3 py-2 text-sm min-w-[120px]"
                        value={filters.location}
                        onChange={e => setFilters({ ...filters, location: e.target.value })}
                    >
                        <option value="">所有儲位</option>
                        {locations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <Button onClick={handleCreate}>+ 新增商品</Button>
                    <div className="border-l pl-2 ml-2 flex gap-2">
                        <Button variant="outline" onClick={handleExport}>匯出 Excel</Button>
                        <Button variant="outline" onClick={() => window.open(`${API_BASE_URL}/inventory/template`, '_blank')}>下載範本</Button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx,.csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleImport}
                            />
                            <Button variant="outline">匯入商品</Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3">SKU</th>
                            <th className="p-3">名稱</th>
                            <th className="p-3">分類</th>
                            <th className="p-3">單位</th>
                            <th className="p-3 text-right">總庫存</th>
                            <th className="p-3">安全庫存</th>
                            <th className="p-3">儲位分佈</th>
                            <th className="p-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? filteredProducts.map(p => (
                            <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-3 font-mono">{p.sku}</td>
                                <td className="p-3 font-medium">{p.name}</td>
                                <td className="p-3">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{p.category}</span>
                                </td>
                                <td className="p-3">{p.unit}</td>
                                <td className="p-3 text-right">
                                    <span className={p.totalStock < p.safetyStock ? 'text-red-600 font-bold' : 'text-green-600'}>
                                        {p.totalStock}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-500">{p.safetyStock}</td>
                                <td className="p-3 text-xs text-gray-500">
                                    {p.locations.length > 0 ? p.locations.map(l => (
                                        <div key={l.location}>{l.location}: {l.quantity}</div>
                                    )) : <span className="text-gray-300">-</span>}
                                </td>
                                <td className="p-3 flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>編輯</Button>
                                    <Button size="sm" variant="ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(p.id)}>刪除</Button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-500">
                                    沒有符合條件的商品
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {(isCreating || editingProduct) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4">
                        <h3 className="text-lg font-bold">{isCreating ? '新增商品' : '編輯商品'}</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="SKU (料號)" value={formData.sku || ''} onChange={e => setFormData({ ...formData, sku: e.target.value })} fullWidth />
                            <Input label="商品名稱" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} fullWidth />
                            <Input label="分類" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} fullWidth />
                            <Input label="單位" value={formData.unit || ''} onChange={e => setFormData({ ...formData, unit: e.target.value })} fullWidth />
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                                <Input label="安全庫存" type="number" value={formData.safetyStock || 0} onChange={e => setFormData({ ...formData, safetyStock: +e.target.value })} fullWidth />
                            </div>
                        </div>

                        {/* Location Editor */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-gray-700">庫存儲位管理</label>
                                <Button size="sm" variant="outline" onClick={() => setFormData({ ...formData, locations: [...(formData.locations || []), { location: '', quantity: 0 }] })}>+ 新增儲位</Button>
                            </div>
                            <div className="bg-gray-50 p-2 rounded space-y-2">
                                {formData.locations?.map((loc, idx) => (
                                    <div key={idx} className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <input
                                                className="w-full border rounded px-2 py-1 text-sm"
                                                placeholder="儲位 (例如 A-01)"
                                                value={loc.location}
                                                onChange={(e) => {
                                                    const newLocs = [...(formData.locations || [])];
                                                    newLocs[idx] = { ...newLocs[idx], location: e.target.value };
                                                    setFormData({ ...formData, locations: newLocs });
                                                }}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                className="w-full border rounded px-2 py-1 text-sm"
                                                placeholder="數量"
                                                value={loc.quantity}
                                                onChange={(e) => {
                                                    const newLocs = [...(formData.locations || [])];
                                                    newLocs[idx] = { ...newLocs[idx], quantity: +e.target.value };
                                                    setFormData({ ...formData, locations: newLocs });
                                                }}
                                            />
                                        </div>
                                        <button className="text-red-500 px-2" onClick={() => {
                                            const newLocs = [...(formData.locations || [])];
                                            newLocs.splice(idx, 1);
                                            setFormData({ ...formData, locations: newLocs });
                                        }}>✕</button>
                                    </div>
                                ))}
                                {(!formData.locations || formData.locations.length === 0) && <div className="text-center text-gray-400 text-sm py-2">尚無儲位資料</div>}
                            </div>
                            <div className="text-right text-sm text-gray-600 mt-2">
                                預覽總庫存: {formData.locations?.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0)}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="ghost" onClick={() => { setIsCreating(false); setEditingProduct(null); }}>取消</Button>
                            <Button onClick={handleSave}>儲存</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
