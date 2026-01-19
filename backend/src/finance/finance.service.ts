import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class FinanceService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        try {
            await this.seedCategories();
        } catch (e) {
            console.error('Failed to seed categories:', e);
        }
    }

    private async seedCategories() {
        const count = await this.prisma.transactionCategory.count();
        if (count === 0) {
            const defaults = [
                { name: '銷售收入', type: 'INCOME', isSystem: true },
                { name: '利息收入', type: 'INCOME', isSystem: true },
                { name: '薪資支出', type: 'EXPENSE', isSystem: true },
                { name: '租金支出', type: 'EXPENSE', isSystem: true },
                { name: '進貨成本', type: 'EXPENSE', isSystem: true },
                { name: '水電費', type: 'EXPENSE', isSystem: true },
                { name: '雜項支出', type: 'EXPENSE', isSystem: true },
            ];

            for (const cat of defaults) {
                await this.prisma.transactionCategory.create({
                    data: {
                        name: cat.name,
                        type: cat.type as any,
                        isSystem: cat.isSystem
                    }
                });
            }
            console.log('Finance Categories Seeded');
        }
    }

    // Categories
    async getCategories() {
        return this.prisma.transactionCategory.findMany({
            orderBy: { id: 'asc' }
        });
    }

    // Transactions
    async getTransactions() {
        return this.prisma.transaction.findMany({
            include: { category: true },
            orderBy: { date: 'desc' }
        });
    }

    async createTransaction(data: any) {
        let categoryId = Number(data.categoryId);

        // Support Legacy Web Payload (sending name as 'category')
        if (isNaN(categoryId) && data.category) {
            const cat = await this.prisma.transactionCategory.findFirst({
                where: { name: data.category }
            });
            if (cat) {
                categoryId = cat.id;
            }
        }

        if (isNaN(categoryId)) {
            throw new Error('Invalid Category');
        }

        return this.prisma.transaction.create({
            data: {
                amount: data.amount, // Decimal handled by Prisma
                type: data.type,
                date: data.date ? new Date(data.date) : new Date(),
                description: data.description,
                categoryId: categoryId,
            },
            include: { category: true }
        });
    }

    async deleteTransaction(id: number) {
        await this.prisma.transaction.delete({ where: { id } });
        return { success: true };
    }

    // Summary
    async getSummary() {
        // Use aggregation for performance
        const incomeAgg = await this.prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: 'INCOME' }
        });
        const expenseAgg = await this.prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: 'EXPENSE' }
        });

        const totalIncome = Number(incomeAgg._sum.amount || 0);
        const totalExpense = Number(expenseAgg._sum.amount || 0);

        return {
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense
        };
    }

    // Monthly Stats
    async getMonthlyStats() {
        // Fetch all (or filter by year if needed) and process in JS for simplicity unless heavy
        // For heavy data, raw query grouping by Month is better. Sticking to simple JS processing for now as MVP.
        const transactions = await this.prisma.transaction.findMany();

        const stats: Record<string, { income: number; expense: number }> = {};

        transactions.forEach(t => {
            const date = new Date(t.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!stats[key]) {
                stats[key] = { income: 0, expense: 0 };
            }

            const amount = Number(t.amount);
            if (t.type === 'INCOME') {
                stats[key].income += amount;
            } else {
                stats[key].expense += amount;
            }
        });

        return Object.entries(stats)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    // Import / Export
    async exportTransactions(format: 'xlsx' | 'csv' = 'xlsx') {
        const transactions = await this.prisma.transaction.findMany({
            include: { category: true },
            orderBy: { date: 'desc' }
        });

        const data = transactions.map(t => ({
            ID: t.id,
            Date: t.date.toISOString().split('T')[0],
            Type: t.type,
            Category: t.category.name,
            Amount: Number(t.amount),
            Description: t.description || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

        if (format === 'csv') {
            return XLSX.write(workbook, { type: 'buffer', bookType: 'csv' });
        } else {
            return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        }
    }

    async importTransactions(fileBuffer: Buffer) {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        let created = 0;
        let errors = 0;

        for (const row of data as any[]) {
            try {
                if (!row.Amount || !row.Type) continue;

                // Resolve Category
                let categoryId: number | undefined;
                if (row.Category) {
                    const cat = await this.prisma.transactionCategory.findFirst({
                        where: { name: String(row.Category) }
                    });
                    if (cat) categoryId = cat.id;
                }

                // Fallback category if not found or not provided?
                // For now, if category not found, try finding a default one
                if (!categoryId) {
                    const defaultCat = await this.prisma.transactionCategory.findFirst({
                        where: { type: row.Type as any }
                    });
                    if (defaultCat) categoryId = defaultCat.id;
                }

                if (!categoryId) throw new Error('No category found');

                await this.prisma.transaction.create({
                    data: {
                        date: row.Date ? new Date(row.Date) : new Date(),
                        amount: Number(row.Amount),
                        type: row.Type as any,
                        description: row.Description ? String(row.Description) : null,
                        categoryId: categoryId
                    }
                });
                created++;
            } catch (e) {
                console.error('Finance Import Row Error', e);
                errors++;
            }
        }
        return { success: true, created, errors };
    }
}
