import { useState, useEffect } from 'react';
import { request } from '../../lib/api';
import { AttendanceWidget } from '../../components/attendance/AttendanceWidget';
import { TodoWidget, Todo } from '../../components/todos/TodoWidget';
import { InventoryWidget } from '../../components/inventory/InventoryWidget';
import styles from './Dashboard.module.css';

export function DashboardPage() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [now, setNow] = useState(new Date()); // State to trigger re-renders for time-based updates
    const userId = 1;

    useEffect(() => {
        loadTodos();

        // Update 'now' every second to check for overdue items in real-time
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const loadTodos = async () => {
        try {
            const data = await request<Todo[]>(`/todos?userId=${userId}`);
            // Filter out completed items to prevent them from resurfacing
            setTodos(data.filter(t => !t.isCompleted));
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddTodo = async (title: string, dueAt?: string) => {
        try {
            // Convert local datetime string to ISO string (UTC) to handle timezone correctly
            // Input 'dueAt' is "YYYY-MM-DDTHH:mm" (Local time)
            let isoDate = undefined;
            if (dueAt) {
                isoDate = new Date(dueAt).toISOString();
            }

            await request('/todos', {
                method: 'POST',
                body: JSON.stringify({ userId, title, dueAt: isoDate }),
            });
            await loadTodos();
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleTodo = async (id: number, isCompleted: boolean) => {
        try {
            // Optimistic update
            setTodos(prev => prev.map(t => t.id === id ? { ...t, isCompleted } : t));

            await request(`/todos/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isCompleted }),
            });

            // If completed, remove from list after 5 seconds
            if (isCompleted) {
                setTimeout(() => {
                    setTodos(prev => prev.filter(t => t.id !== id));
                }, 5000);
            }
        } catch (err) {
            console.error(err);
            loadTodos();
        }
    };

    const overdueCount = todos.filter(t =>
        !t.isCompleted &&
        t.dueAt &&
        new Date(t.dueAt) < now
    ).length;

    return (
        <div className={styles.container}>
            {overdueCount > 0 && (
                <div className={styles.alertBanner}>
                    ⚠️ 您有 {overdueCount} 項待辦事項已逾期，請盡快處理！
                </div>
            )}

            <div className={styles.header}>
                <h2 className={styles.title}>儀表板</h2>
                <span className={styles.date}>
                    {new Date().toLocaleDateString()}
                </span>
            </div>

            <div className={styles.grid}>
                <div className={styles.sectionAttendance}>
                    <AttendanceWidget />
                </div>
                <div className={styles.sectionTodos}>
                    <TodoWidget
                        todos={todos}
                        currentTime={now}
                        onAdd={handleAddTodo}
                        onToggle={handleToggleTodo}
                    />
                </div>
                <div className={styles.sectionInventory}>
                    <InventoryWidget />
                </div>
            </div>
        </div>
    );
}
