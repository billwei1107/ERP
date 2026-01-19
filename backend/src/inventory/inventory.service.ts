import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) { }

  // 1. Products
  async getProducts() {
    const products = await this.prisma.product.findMany({
      include: { locations: true },
      orderBy: { id: 'desc' }
    });
    return products.map(p => ({
      ...p,
      // Ensure numeric types from DB are handled if needed (Prisma returns standard JS types mostly)
      // totalStock is already in DB as a sync field
    }));
  }

  async createProduct(data: any) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Product
      const product = await tx.product.create({
        data: {
          sku: data.sku,
          name: data.name,
          category: data.category,
          unit: data.unit,
          safetyStock: Number(data.safetyStock) || 0,
          totalStock: 0, // Will update after locations
        },
      });

      // 2. Create Initial Locations (if any)
      if (data.locations && data.locations.length > 0) {
        let total = 0;
        for (const loc of data.locations) {
          const qty = Number(loc.quantity) || 0;
          if (qty > 0 || loc.location) {
            await tx.productLocation.create({
              data: {
                productId: product.id,
                location: loc.location,
                quantity: qty
              }
            });
            total += qty;
          }
        }
        // Update total
        if (total > 0) {
          await tx.product.update({
            where: { id: product.id },
            data: { totalStock: total }
          });
        }
      }
      return product;
    });
  }

  async updateProduct(id: number, data: any) {
    // NOTE: Simplified update. Real world might need careful location diffing.
    // For now, allow updating basic fields. Direct location update via product update is risky.
    // We assume this endpoint is mainly for updating metadata (name, sku, safetyStock).
    return this.prisma.product.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        category: data.category,
        unit: data.unit,
        safetyStock: Number(data.safetyStock),
      }
    });
  }

  async removeProduct(id: number) {
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  async getMovements() {
    const movements = await this.prisma.stockMovement.findMany({
      include: { product: true },
      orderBy: { date: 'desc' }
    });
    return movements.map(m => ({
      ...m,
      productName: m.product.name,
      sku: m.product.sku
    }));
  }

  async createMovement(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: data.productId }, include: { locations: true } });
      if (!product) throw new Error('Product not found');

      const qty = Number(data.quantity);
      let newTotal = product.totalStock;

      // Handle Logic
      if (data.type === 'IN') {
        const loc = data.toLocation;
        let locationEntry = await tx.productLocation.findUnique({
          where: { productId_location: { productId: product.id, location: loc } }
        });

        if (!locationEntry) {
          locationEntry = await tx.productLocation.create({
            data: { productId: product.id, location: loc, quantity: 0 }
          });
        }

        await tx.productLocation.update({
          where: { id: locationEntry.id },
          data: { quantity: { increment: qty } }
        });
        newTotal += qty;

      } else if (data.type === 'OUT') {
        const loc = data.fromLocation;
        const locationEntry = await tx.productLocation.findUnique({
          where: { productId_location: { productId: product.id, location: loc } }
        });

        if (!locationEntry || locationEntry.quantity < qty) {
          throw new Error('Insufficient stock in location ' + loc);
        }

        await tx.productLocation.update({
          where: { id: locationEntry.id },
          data: { quantity: { decrement: qty } }
        });
        newTotal -= qty;

      } else if (data.type === 'TRANSFER') {
        const fromLoc = data.fromLocation;
        const toLoc = data.toLocation;

        const sourceEntry = await tx.productLocation.findUnique({
          where: { productId_location: { productId: product.id, location: fromLoc } }
        });

        if (!sourceEntry || sourceEntry.quantity < qty) {
          throw new Error('Insufficient stock in source ' + fromLoc);
        }

        let targetEntry = await tx.productLocation.findUnique({
          where: { productId_location: { productId: product.id, location: toLoc } }
        });
        if (!targetEntry) {
          targetEntry = await tx.productLocation.create({
            data: { productId: product.id, location: toLoc, quantity: 0 }
          });
        }

        await tx.productLocation.update({ where: { id: sourceEntry.id }, data: { quantity: { decrement: qty } } });
        await tx.productLocation.update({ where: { id: targetEntry.id }, data: { quantity: { increment: qty } } });
        // Total stock unchanged
      }

      // Sync Total Stock
      await tx.product.update({
        where: { id: product.id },
        data: { totalStock: newTotal }
      });

      // Log Movement
      return tx.stockMovement.create({
        data: {
          productId: product.id,
          type: data.type,
          quantity: qty,
          fromLocation: data.fromLocation,
          toLocation: data.toLocation,
          reason: data.reason,
          date: new Date(),
        }
      });
    });
  }

  // Stock Takes
  async getStockTakes() {
    return this.prisma.stockTake.findMany({
      include: { items: true },
      orderBy: { id: 'desc' }
    });
  }

  async createStockTake(note?: string, targetLocations?: string[]) {
    return this.prisma.$transaction(async (tx) => {
      const stockTake = await tx.stockTake.create({
        data: {
          note,
          targetLocations: targetLocations || [],
          status: 'IN_PROGRESS'
        }
      });

      // Create Items Snapshot
      const products = await tx.product.findMany({ include: { locations: true } });

      for (const p of products) {
        // Filter locations if targetLocations is set
        const locs = (targetLocations && targetLocations.length > 0)
          ? p.locations.filter(l => targetLocations.includes(l.location))
          : p.locations;

        for (const l of locs) {
          await tx.stockTakeItem.create({
            data: {
              stockTakeId: stockTake.id,
              productId: p.id,
              sku: p.sku,
              productName: p.name,
              location: l.location,
              systemStock: l.quantity,
              actualStock: l.quantity,
              difference: 0
            }
          });
        }
      }

      return tx.stockTake.findUnique({ where: { id: stockTake.id }, include: { items: true } });
    });
  }

  async updateStockTakeItems(id: number, items: any[]) {
    // Draft Save
    return this.prisma.$transaction(async (tx) => {
      const st = await tx.stockTake.findUnique({ where: { id } });
      if (!st || st.status === 'COMPLETED') throw new Error('Invalid stock take state');

      for (const item of items) {
        if (item.id) {
          await tx.stockTakeItem.update({
            where: { id: item.id },
            data: {
              actualStock: Number(item.actualStock),
              difference: Number(item.actualStock) - Number(item.systemStock)
            }
          });
        }
      }
      return tx.stockTake.findUnique({ where: { id }, include: { items: true } });
    });
  }

  async submitStockTake(id: number, items: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const st = await tx.stockTake.findUnique({ where: { id }, include: { items: true } });
      if (!st || st.status === 'COMPLETED') throw new Error('Already completed');

      // 1. Update Items Final
      for (const item of items) {
        await tx.stockTakeItem.update({
          where: { id: item.id },
          data: {
            actualStock: Number(item.actualStock),
            difference: Number(item.actualStock) - Number(item.systemStock)
          }
        });
      }

      // 2. Adjust Stock
      const updatedItems = await tx.stockTakeItem.findMany({ where: { stockTakeId: id } });

      for (const item of updatedItems) {
        if (item.difference !== 0) {
          // Find or Create location
          let locEntry = await tx.productLocation.findUnique({
            where: { productId_location: { productId: item.productId, location: item.location } }
          });

          if (!locEntry) {
            locEntry = await tx.productLocation.create({
              data: { productId: item.productId, location: item.location, quantity: 0 }
            });
          }

          // Update Quantity
          await tx.productLocation.update({
            where: { id: locEntry.id },
            data: { quantity: item.actualStock }
          });

          // Update Product Total
          // (This loops inside loop, maybe inefficient but safe)
          const pLocs = await tx.productLocation.findMany({ where: { productId: item.productId } });
          const newTotal = pLocs.reduce((sum, l) => sum + l.quantity, 0);
          await tx.product.update({ where: { id: item.productId }, data: { totalStock: newTotal } });

          // Log Movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: item.difference > 0 ? 'IN' : 'OUT',
              quantity: Math.abs(item.difference),
              reason: `盤點調整 #${id}`,
              date: new Date(),
              [item.difference > 0 ? 'toLocation' : 'fromLocation']: item.location
            }
          });
        }
      }

      // 3. Complete
      return tx.stockTake.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: { items: true }
      });
    });
  }

  // Helpers
  async getSummary() {
    const totalProducts = await this.prisma.product.count();
    // Safety check approximation (raw query might be faster but this is fine)
    const lowStockCount = await this.prisma.product.count({
      where: {
        totalStock: { lt: this.prisma.product.fields.safetyStock }
      }
    });

    return {
      totalProducts,
      lowStockCount,
      totalValue: 0 // Implement if price * stock needed
    };
  }

  async getAlerts() {
    return this.prisma.product.findMany({
      where: {
        totalStock: { lt: this.prisma.product.fields.safetyStock }
      },
      select: {
        id: true,
        name: true,
        totalStock: true,
        safetyStock: true
      }
    });
  }


  // Import / Export
  async exportInventory(format: 'xlsx' | 'csv' = 'xlsx') {
    const products = await this.prisma.product.findMany({
      include: { locations: true }
    });

    // Flatten data for export
    const data = products.map(p => {
      const locationStr = p.locations.map(l => `${l.location}:${l.quantity}`).join('; ');
      return {
        ID: p.id,
        SKU: p.sku,
        Name: p.name,
        Category: p.category,
        Unit: p.unit,
        SafetyStock: p.safetyStock,
        TotalStock: p.totalStock,
        Locations: locationStr
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    if (format === 'csv') {
      return XLSX.write(workbook, { type: 'buffer', bookType: 'csv' });
    } else {
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
  }

  async importInventory(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const row of data as any[]) {
      try {
        if (!row.Name || !row.Category) continue;

        // Basic fields
        const sku = row.SKU ? String(row.SKU) : `AUTO-${Date.now()}`; // Fallback if no SKU

        // Find existing by SKU or Name
        let product = await this.prisma.product.findFirst({
          where: {
            OR: [
              { sku: sku },
              { name: String(row.Name) }
            ]
          }
        });

        if (product) {
          // Update
          await this.prisma.product.update({
            where: { id: product.id },
            data: {
              name: String(row.Name),
              category: String(row.Category),
              unit: row.Unit ? String(row.Unit) : product.unit,
              safetyStock: row.SafetyStock ? Number(row.SafetyStock) : product.safetyStock,
            }
          });
          updated++;
        } else {
          // Create
          product = await this.prisma.product.create({
            data: {
              sku: sku,
              name: String(row.Name),
              category: String(row.Category),
              unit: row.Unit ? String(row.Unit) : '個',
              safetyStock: row.SafetyStock ? Number(row.SafetyStock) : 10,
              totalStock: 0
            }
          });
          created++;
        }

        // Handle Locations string "A1:10; B2:5"
        if (row.Locations) {
          const locParts = String(row.Locations).split(';').map(s => s.trim());
          let newTotal = 0;

          for (const part of locParts) {
            const [locName, qtyStr] = part.split(':');
            if (locName && qtyStr) {
              const qty = Number(qtyStr);

              // Upsert location
              const locEntry = await this.prisma.productLocation.findUnique({
                where: { productId_location: { productId: product.id, location: locName } }
              });

              if (locEntry) {
                await this.prisma.productLocation.update({
                  where: { id: locEntry.id },
                  data: { quantity: qty }
                });
              } else {
                await this.prisma.productLocation.create({
                  data: { productId: product.id, location: locName, quantity: qty }
                });
              }
              newTotal += qty;
            }
          }
          // Sync total
          await this.prisma.product.update({
            where: { id: product.id },
            data: { totalStock: newTotal }
          });
        }

      } catch (e) {
        console.error('Row Import Error:', e);
        errors++;
      }
    }

    return { success: true, created, updated, errors };
  }

  async create(data: any) { return 'Implemented'; }
  async findAll() { return []; }
  async remove(id: number) { return 'Implemented'; }
}
