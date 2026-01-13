import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Category, Transaction, FinanceSummary } from './finance.interface';

@Injectable()
export class FinanceService {
    private readonly DATA_FILE = path.resolve('finance-data.json');

    private categories: Category[] = [
        { id: 1, name: '銷售收入', type: 'INCOME' },
        { id: 2, name: '利息收入', type: 'INCOME' },
        { id: 3, name: '薪資支出', type: 'EXPENSE' },
        { id: 4, name: '租金支出', type: 'EXPENSE' },
        { id: 5, name: '進貨成本', type: 'EXPENSE' },
        { id: 6, name: '水電費', type: 'EXPENSE' },
        { id: 7, name: '雜項支出', type: 'EXPENSE' },
    ];

    private transactions: Transaction[] = [];

    constructor() {
        this.loadData();
    }

    private loadData() {
        if (fs.existsSync(this.DATA_FILE)) {
            try {
                const raw = fs.readFileSync(this.DATA_FILE, 'utf-8');
                const data = JSON.parse(raw);
                if (data.categories) this.categories = data.categories;
                if (data.transactions) this.transactions = data.transactions;
                console.log('Finance data loaded from ' + this.DATA_FILE);
            } catch (err) {
                console.error('Failed to load finance data:', err);
            }
        } else {
            console.log('No existing finance data, using defaults.');
            this.saveData();
        }
    }

    private saveData() {
        const data = {
            categories: this.categories,
            transactions: this.transactions
        };
        try {
            fs.writeFileSync(this.DATA_FILE, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('Failed to save finance data:', err);
        }
    }

    // Categories
    getCategories() {
        return this.categories;
    }

    // Transactions
    getTransactions() {
        return this.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    createTransaction(data: Omit<Transaction, 'id'>) {
        const newTransaction: Transaction = {
            id: Date.now(),
            ...data
        };
        this.transactions.unshift(newTransaction);
        this.saveData();
        return newTransaction;
    }

    deleteTransaction(id: number) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveData();
        return { success: true };
    }

    // Summary
    getSummary(): FinanceSummary {
        const totalIncome = this.transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = this.transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense
        };
    }

    // Monthly Stats for Charts
    getMonthlyStats() {
        const stats: Record<string, { income: number; expense: number }> = {};

        this.transactions.forEach(t => {
            const date = new Date(t.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!stats[key]) {
                stats[key] = { income: 0, expense: 0 };
            }

            if (t.type === 'INCOME') {
                stats[key].income += t.amount;
            } else {
                stats[key].expense += t.amount;
            }
        });

        // Convert to array and sort by date
        return Object.entries(stats)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }
}
