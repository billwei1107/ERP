import { useState, useEffect } from 'react';
import { request } from '../../lib/api';
import styles from './InventoryWidget.module.css';

interface InventorySummary {
    totalProducts: number;
    lowStockCount: number;
    totalValue: number;
}

interface InventoryAlert {
    id: number;
    name: string;
    stockQuantity: number;
    minStockLevel: number;
}

export function InventoryWidget() {
    const [summary, setSummary] = useState<InventorySummary | null>(null);
    const [alerts, setAlerts] = useState<InventoryAlert[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [sumData, alertData] = await Promise.all([
                request<InventorySummary>('/inventory/summary'),
                request<InventoryAlert[]>('/inventory/alerts'),
            ]);
            setSummary(sumData);
            setAlerts(alertData);
        } catch (err) {
            console.error(err);
        }
    };

    if (!summary) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <h3 className={styles.header}>庫存速覽</h3>

            <div className={styles.metrics}>
                <div className={styles.metricCard}>
                    <span className={styles.metricValue}>{summary.totalProducts}</span>
                    <span className={styles.metricLabel}>總商品數</span>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricValue} style={{ color: 'var(--color-danger)' }}>
                        {summary.lowStockCount}
                    </span>
                    <span className={styles.metricLabel}>低庫存品項</span>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricValue}>
                        ${(summary.totalValue / 10000).toFixed(1)}w
                    </span>
                    <span className={styles.metricLabel}>總庫存價值</span>
                </div>
            </div>

            {alerts.length > 0 && (
                <div className={styles.alertsSection}>
                    <h4 className={styles.subHeader}>
                        <span className={styles.dangerIcon}>⚠️</span>
                        庫存告急警報
                    </h4>
                    <ul className={styles.alertList}>
                        {alerts.map(item => (
                            <li key={item.id} className={styles.alertItem}>
                                <span className={styles.itemName}>{item.name}</span>
                                <span className={styles.itemStock}>
                                    庫存: {item.stockQuantity} (低於 {item.minStockLevel})
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
