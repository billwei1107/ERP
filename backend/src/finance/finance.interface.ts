export interface Category {
    id: number;
    name: string;
    type: 'INCOME' | 'EXPENSE';
}

export interface Transaction {
    id: number;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: string;
    date: string;
    description?: string;
}

export interface FinanceSummary {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
}
