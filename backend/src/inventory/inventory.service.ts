import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ProductLocationEntry {
  location: string;
  quantity: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  safetyStock: number;
  totalStock: number; // Sum of all locations
  locations: ProductLocationEntry[];
}

export interface StockMovement {
  id: number;
  productId: number;
  type: 'IN' | 'OUT' | 'TRANSFER';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason?: string;
  date: string;
}

export interface StockTakeItem {
  productId: number;
  productName: string;
  sku: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  location: string; // Specific location for this item line
}

export interface StockTake {
  id: number;
  date: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  items: StockTakeItem[];
  note?: string;
  targetLocations?: string[];
}

@Injectable()
export class InventoryService {
  private readonly DATA_FILE = path.resolve('inventory-data-v2.json');

  private products: Product[] = [
    {
      id: 1,
      sku: 'PROD-001',
      name: '無線滑鼠',
      category: '3C周邊',
      unit: '個',
      safetyStock: 10,
      totalStock: 45,
      locations: [{ location: 'A-01', quantity: 45 }]
    },
    {
      id: 2,
      sku: 'PROD-002',
      name: '機械鍵盤',
      category: '3C周邊',
      unit: '把',
      safetyStock: 5,
      totalStock: 12,
      locations: [{ location: 'A-02', quantity: 12 }]
    },
  ];
  private movements: StockMovement[] = [];
  private stockTakes: StockTake[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    if (fs.existsSync(this.DATA_FILE)) {
      try {
        const raw = fs.readFileSync(this.DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.products) this.products = data.products;
        if (data.movements) this.movements = data.movements;
        if (data.stockTakes) this.stockTakes = data.stockTakes;
        console.log('Data loaded from ' + this.DATA_FILE);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    } else {
      console.log('No existing data file (v2), using defaults.');
      this.saveData();
    }
  }

  private saveData() {
    const data = {
      products: this.products,
      movements: this.movements,
      stockTakes: this.stockTakes
    };
    try {
      fs.writeFileSync(this.DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  }

  async getProducts() {
    // Recalculate totalStock on read to ensure consistency
    this.products.forEach(p => {
      p.totalStock = p.locations.reduce((sum, loc) => sum + loc.quantity, 0);
    });
    return this.products;
  }

  async getStockTakes() {
    return this.stockTakes;
  }

  async createStockTake(note?: string, targetLocations?: string[]) {
    const items: StockTakeItem[] = [];

    // Flatten products + locations into items
    for (const p of this.products) {
      // If filtering by location, only include those locations
      const relevantLocations = (targetLocations && targetLocations.length > 0)
        ? p.locations.filter(l => targetLocations.includes(l.location))
        : p.locations;

      for (const loc of relevantLocations) {
        items.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          systemStock: loc.quantity,
          actualStock: loc.quantity,
          difference: 0,
          location: loc.location
        });
      }
    }

    const newStockTake: StockTake = {
      id: Date.now(),
      date: new Date().toISOString(),
      status: 'IN_PROGRESS',
      items,
      note,
      targetLocations
    };

    this.stockTakes.unshift(newStockTake);
    this.saveData();
    return newStockTake;
  }

  async submitStockTake(id: number, items: StockTakeItem[]) {
    const stockTake = this.stockTakes.find(st => st.id === id);
    if (!stockTake) throw new Error('Stock Take not found');
    if (stockTake.status === 'COMPLETED') throw new Error('Stock Take already completed');

    // Update items with submitted actuals
    stockTake.items = items.map(item => ({
      ...item,
      difference: item.actualStock - item.systemStock
    }));

    // Apply adjustments
    for (const item of stockTake.items) {
      if (item.difference !== 0) {
        const product = this.products.find(p => p.id === item.productId);
        if (product && item.location) {

          let locEntry = product.locations.find(l => l.location === item.location);
          if (!locEntry) {
            // Should not happen if strictly following planned items, but if user added new line... 
            // for now assume valid location. If not found, maybe create? 
            // Stock take usually validates existing. Let's create if missing (surplus found in new loc)
            locEntry = { location: item.location, quantity: 0 };
            product.locations.push(locEntry);
          }

          locEntry.quantity = item.actualStock;

          // Log movement
          this.movements.unshift({
            id: Math.floor(Math.random() * 100000),
            productId: item.productId,
            type: item.difference > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(item.difference),
            reason: `盤點調整 (單號: ${stockTake.id}, 儲位: ${item.location})`,
            date: new Date().toISOString(),
            // Log location context
            [item.difference > 0 ? 'toLocation' : 'fromLocation']: item.location
          });
        }
      }
    }

    // Recalculate totals
    this.products.forEach(p => {
      p.totalStock = p.locations.reduce((sum, l) => sum + l.quantity, 0);
    });

    stockTake.status = 'COMPLETED';
    this.saveData();
    return stockTake;
  }

  async createMovement(data: Omit<StockMovement, 'id' | 'date'>) {
    const product = this.products.find(p => p.id === data.productId);
    if (!product) throw new Error('Product not found');

    if (data.type === 'IN') {
      if (!data.toLocation) throw new Error('Target location (toLocation) required for IN');
      let locEntry = product.locations.find(l => l.location === data.toLocation);
      if (!locEntry) {
        locEntry = { location: data.toLocation, quantity: 0 };
        product.locations.push(locEntry);
      }
      locEntry.quantity += data.quantity;

    } else if (data.type === 'OUT') {
      if (!data.fromLocation) throw new Error('Source location (fromLocation) required for OUT');
      const locEntry = product.locations.find(l => l.location === data.fromLocation);
      if (!locEntry || locEntry.quantity < data.quantity) {
        throw new Error(`Insufficient stock in location ${data.fromLocation}`);
      }
      locEntry.quantity -= data.quantity;
      // Optional: Remove location entry if 0? Let's keep it for now.

    } else if (data.type === 'TRANSFER') {
      if (!data.fromLocation || !data.toLocation) throw new Error('Both fromLocation and toLocation required for TRANSFER');
      if (data.fromLocation === data.toLocation) throw new Error('Cannot transfer to same location');

      const source = product.locations.find(l => l.location === data.fromLocation);
      if (!source || source.quantity < data.quantity) {
        throw new Error(`Insufficient stock in source location ${data.fromLocation}`);
      }

      let target = product.locations.find(l => l.location === data.toLocation);
      if (!target) {
        target = { location: data.toLocation, quantity: 0 };
        product.locations.push(target);
      }

      source.quantity -= data.quantity;
      target.quantity += data.quantity;
    }

    // Update total stock
    product.totalStock = product.locations.reduce((sum, l) => sum + l.quantity, 0);

    const newMovement: StockMovement = {
      id: Math.floor(Math.random() * 10000),
      ...data,
      date: new Date().toISOString(),
    };
    this.movements.unshift(newMovement); // Newest first
    this.saveData();
    return newMovement;
  }

  async getMovements() {
    // Join with product name for easier frontend display
    return this.movements.map(m => {
      const p = this.products.find(prod => prod.id === m.productId);
      return { ...m, productName: p?.name || 'Unknown', sku: p?.sku || 'Unknown' };
    });
  }

  async createProduct(data: any) {
    const newId = Math.max(...this.products.map(p => p.id), 0) + 1;
    // data.locations should be passed from frontend
    const locations = data.locations || [];
    const totalStock = locations.reduce((sum: number, l: any) => sum + (Number(l.quantity) || 0), 0);

    const newProduct: Product = {
      id: newId,
      sku: data.sku,
      name: data.name,
      category: data.category,
      unit: data.unit,
      safetyStock: Number(data.safetyStock) || 0,
      totalStock,
      locations
    };

    this.products.push(newProduct);
    this.saveData();
    return newProduct;
  }

  async updateProduct(id: number, data: any) {
    const index = this.products.findIndex(p => p.id === Number(id));
    if (index === -1) return null;

    // Merge updates
    const existing = this.products[index];

    // If locations updated, recalc total
    let locations = existing.locations;
    if (data.locations) {
      locations = data.locations.map((l: any) => ({
        location: l.location,
        quantity: Number(l.quantity)
      }));
    }

    const totalStock = locations.reduce((sum, l) => sum + l.quantity, 0);

    this.products[index] = {
      ...existing,
      ...data,
      locations,
      totalStock
    };

    this.saveData();
    return this.products[index];
  }

  async removeProduct(id: number) {
    this.products = this.products.filter(p => p.id !== Number(id));
    this.saveData();
    return { success: true };
  }

  async getSummary() {
    return {
      totalProducts: this.products.length,
      lowStockCount: this.products.filter(p => p.totalStock < p.safetyStock).length,
      totalValue: 0,
    };
  }

  async getAlerts() {
    return this.products
      .filter(p => p.totalStock < p.safetyStock)
      .map(p => ({
        id: p.id,
        name: p.name,
        stockQuantity: p.totalStock,
        minStockLevel: p.safetyStock
      }));
  }

  // Legacy placeholders
  create(data: any) { return 'Adds new inventory'; }
  findAll() { return []; }
  findOne(id: number) { return null; }
  update(id: number, data: any) { return 'Updates inventory'; }
  remove(id: number) { return 'Removes inventory'; }
}
