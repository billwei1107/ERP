import { useState } from 'react';
import { ProductManagement } from './ProductManagement';
import { InventoryMovements } from './InventoryMovements';
import { StockTaking } from './StockTaking';

export function InventoryPage() {
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'MOVEMENTS' | 'STOCKTAKING'>('PRODUCTS');

    return (
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">庫存管理</h2>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'PRODUCTS'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('PRODUCTS')}
                >
                    商品管理
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'MOVEMENTS'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('MOVEMENTS')}
                >
                    庫存異動
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'STOCKTAKING'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('STOCKTAKING')}
                >
                    庫存盤點
                </button>
            </div>

            {/* Tab Content - remove padding from children since we handle it here or in child */}
            <div className="-mx-6">
                {/* Negative margin to counteract the child padding if they have it, 
                    OR we can modify children to accept className. 
                    Actually, looking at previous code, they have padding: 1.5rem wrapper.
                    We can wrap them in a div that might hide that padding or we just let them have padding.
                    Let's just render them. Ideally we should refactor them to not have hardcoded padding, 
                    but for now rendering them directly is fine, they will just have padding inside the tab area.
                */}
                <div style={activeTab === 'PRODUCTS' ? { display: 'block' } : { display: 'none' }}>
                    <ProductManagement />
                </div>
                <div style={activeTab === 'MOVEMENTS' ? { display: 'block' } : { display: 'none' }}>
                    <InventoryMovements />
                </div>
                <div style={activeTab === 'STOCKTAKING' ? { display: 'block' } : { display: 'none' }}>
                    <StockTaking />
                </div>
            </div>
        </div>
    );
}
