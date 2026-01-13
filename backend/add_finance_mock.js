const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, 'finance-data.json');

const CATEGORIES = [
    { id: 1, name: '銷售收入', type: 'INCOME' },
    { id: 2, name: '利息收入', type: 'INCOME' },
    { id: 3, name: '薪資支出', type: 'EXPENSE' },
    { id: 4, name: '租金支出', type: 'EXPENSE' },
    { id: 5, name: '進貨成本', type: 'EXPENSE' },
    { id: 6, name: '水電費', type: 'EXPENSE' },
    { id: 7, name: '雜項支出', type: 'EXPENSE' },
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const DESCRIPTIONS = {
    'INCOME': ['商品銷售', '服務收入', '專案尾款', '定期存款利息'],
    'EXPENSE': ['辦公室租金', '員工薪資', '採購原料', '電費', '水費', '文具採購', '伺服器費用']
};

try {
    const transactions = [];
    const startDate = new Date('2025-10-01');
    const endDate = new Date('2026-01-13');

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Randomly generate 0-3 transactions per day
        const count = getRandomInt(0, 3);

        for (let i = 0; i < count; i++) {
            const isIncome = Math.random() > 0.6; // 40% chance of income
            const type = isIncome ? 'INCOME' : 'EXPENSE';

            // Filter categories by type
            const relevantCats = CATEGORIES.filter(c => c.type === type);
            const cat = relevantCats[getRandomInt(0, relevantCats.length - 1)];

            const amount = isIncome ? getRandomInt(1000, 20000) : getRandomInt(100, 5000);
            const descList = DESCRIPTIONS[type];
            const desc = descList[getRandomInt(0, descList.length - 1)];

            transactions.push({
                id: Date.now() + Math.random(),
                type,
                amount,
                category: cat.name,
                date: d.toISOString().split('T')[0],
                description: `${desc} - ${d.getMonth() + 1}/${d.getDate()}`
            });
        }
    }

    const data = {
        categories: CATEGORIES,
        transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`Successfully generated ${transactions.length} transactions in ${DATA_FILE}`);

} catch (err) {
    console.error('Error generating finance data:', err);
}
