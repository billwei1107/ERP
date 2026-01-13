const fs = require('fs');
const path = require('path');

const dataFile = path.resolve('backend/finance-data.json');

const categories = [
    { id: 1, name: '銷售收入', type: 'INCOME' },
    { id: 2, name: '利息收入', type: 'INCOME' },
    { id: 3, name: '薪資支出', type: 'EXPENSE' },
    { id: 4, name: '租金支出', type: 'EXPENSE' },
    { id: 5, name: '進貨成本', type: 'EXPENSE' },
    { id: 6, name: '水電費', type: 'EXPENSE' },
    { id: 7, name: '雜項支出', type: 'EXPENSE' },
];

const transactions = [
    { id: 101, type: 'INCOME', amount: 50000, category: '銷售收入', date: '2026-01-15', description: '專案首款' },
    { id: 102, type: 'EXPENSE', amount: 3000, category: '水電費', date: '2026-01-14', description: '1月電費' },
    { id: 103, type: 'EXPENSE', amount: 12000, category: '租金支出', date: '2026-01-10', description: '辦公室租金' },
    { id: 104, type: 'INCOME', amount: 1500, category: '利息收入', date: '2026-01-05', description: '定存利息' },
    { id: 105, type: 'EXPENSE', amount: 45000, category: '薪資支出', date: '2026-01-01', description: '12月員工薪資' },
    { id: 106, type: 'EXPENSE', amount: 5000, category: '進貨成本', date: '2025-12-28', description: '文具採購' },
    { id: 107, type: 'INCOME', amount: 8000, category: '銷售收入', date: '2025-12-25', description: '聖誕促銷' },
    { id: 108, type: 'EXPENSE', amount: 200, category: '雜項支出', date: '2025-12-20', description: '下午茶' },
    { id: 109, type: 'INCOME', amount: 12000, category: '銷售收入', date: '2025-12-15', description: '專案B驗收' },
    { id: 110, type: 'EXPENSE', amount: 2500, category: '水電費', date: '2025-12-10', description: '12月水費' }
];

const data = {
    categories,
    transactions
};

fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
console.log('Finance data reset successfully.');
