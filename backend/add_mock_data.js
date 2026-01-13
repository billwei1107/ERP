const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, 'inventory-data-v2.json');

// New locations
const NEW_LOCATIONS = ['A-03', 'B-01', 'B-02', 'C-01', 'C-02'];

// New products data
const MOCK_PRODUCTS_BASE = [
    { name: 'USB-C 傳輸線', sku: 'ACC-001', category: '3C周邊', unit: '條', price: 150 },
    { name: '手機支架', sku: 'ACC-002', category: '3C周邊', unit: '個', price: 299 },
    { name: 'HDMI 線 2M', sku: 'ACC-003', category: '3C周邊', unit: '條', price: 350 },
    { name: '藍芽耳機', sku: 'AUD-001', category: '3C周邊', unit: '個', price: 1200 },
    { name: '電競滑鼠', sku: 'PER-005', category: '電競設備', unit: '個', price: 2500 },
    { name: '機械鍵盤青軸', sku: 'PER-006', category: '電競設備', unit: '把', price: 3200 },
    { name: '螢幕清潔組', sku: 'CLN-001', category: '清潔用品', unit: '組', price: 99 },
    { name: '筆記本', sku: 'OFF-001', category: '辦公用品', unit: '本', price: 50 },
    { name: '原子筆(黑)', sku: 'OFF-002', category: '辦公用品', unit: '支', price: 10 },
    { name: '文件夾', sku: 'OFF-003', category: '辦公用品', unit: '個', price: 45 }
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

try {
    let data = { products: [], movements: [], stockTakes: [] };

    // Read existing
    if (fs.existsSync(DATA_FILE)) {
        console.log('Reading existing data from ' + DATA_FILE);
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        data = JSON.parse(raw);
    } else {
        console.log('No existing data file found at ' + DATA_FILE);
    }

    // Determine starting ID
    const maxId = data.products.reduce((max, p) => Math.max(max, p.id), 0);
    let currentId = maxId + 1;

    // Generate new products
    for (const prodBase of MOCK_PRODUCTS_BASE) {
        // Skip if SKU exists
        if (data.products.some(p => p.sku === prodBase.sku)) {
            console.log(`Skipping existing SKU: ${prodBase.sku}`);
            continue;
        }

        // Randomly assign 1 to 3 distinct locations
        const numLocs = getRandomInt(1, 3);
        const assignedLocs = [];
        const usedLocs = new Set();

        while (assignedLocs.length < numLocs) {
            const loc = NEW_LOCATIONS[getRandomInt(0, NEW_LOCATIONS.length - 1)];
            if (!usedLocs.has(loc)) {
                usedLocs.add(loc);
                assignedLocs.push({
                    location: loc,
                    quantity: getRandomInt(5, 100)
                });
            }
        }

        const totalStock = assignedLocs.reduce((sum, l) => sum + l.quantity, 0);

        const newProduct = {
            id: currentId++,
            sku: prodBase.sku,
            name: prodBase.name,
            category: prodBase.category,
            unit: prodBase.unit,
            safetyStock: 10,
            totalStock: totalStock,
            locations: assignedLocs
        };

        data.products.push(newProduct);
        console.log(`Added product: ${newProduct.name} (${newProduct.sku})`);
    }

    // Save back
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Successfully wrote updated data to ' + DATA_FILE);

} catch (err) {
    console.error('Error generating data:', err);
}
