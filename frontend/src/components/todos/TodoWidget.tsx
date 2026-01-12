import { useState } from 'react';
import { Button } from '../ui/button';
import styles from './TodoWidget.module.css';

export interface Todo {
    id: number;
    title: string;
    description?: string;
    isCompleted: boolean;
    dueAt?: string;
}

interface TodoWidgetProps {
    todos: Todo[];
    currentTime?: Date;
    onAdd: (title: string, dueAt?: string) => void;
    onToggle: (id: number, isCompleted: boolean) => void;
}

export function TodoWidget({ todos, currentTime, onAdd, onToggle }: TodoWidgetProps) {
    const [newTodo, setNewTodo] = useState('');
    const [dueAt, setDueAt] = useState('');

    const handleAddClick = () => {
        if (!newTodo.trim()) return;
        onAdd(newTodo, dueAt || undefined);
        setNewTodo('');
        setDueAt('');
    };

    const isOverdue = (todo: Todo) => {
        const now = currentTime || new Date();
        return !todo.isCompleted && todo.dueAt && new Date(todo.dueAt) < now;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                待辦提醒
                <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                    {todos.filter(t => !t.isCompleted).length} 待完成
                </span>
            </div>

            <ul className={styles.list}>
                {todos.length === 0 && (
                    <li className={styles.item} style={{ justifyContent: 'center', color: 'var(--text-light)' }}>
                        無待辦事項
                    </li>
                )}
                {todos.map(todo => (
                    <li key={todo.id} className={styles.item}>
                        <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={todo.isCompleted}
                            onChange={(e) => onToggle(todo.id, e.target.checked)}
                        />
                        <div className={styles.content}>
                            <span className={`
                                ${styles.title} 
                                ${todo.isCompleted ? styles.completed : ''}
                                ${isOverdue(todo) ? styles.overdue : ''}
                            `}>
                                {todo.title}
                            </span>
                            {todo.dueAt && (
                                <span className={`${styles.meta} ${isOverdue(todo) ? styles.overdue : ''}`}>
                                    到期: {new Date(todo.dueAt).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            <div className={styles.inputGroup} style={{ flexDirection: 'column' }}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="新增事項..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="datetime-local"
                        className={styles.input}
                        value={dueAt}
                        onChange={(e) => setDueAt(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Button onClick={handleAddClick} className={styles.btnAdd}>
                        +
                    </Button>
                </div>
            </div>
        </div>
    );
}
