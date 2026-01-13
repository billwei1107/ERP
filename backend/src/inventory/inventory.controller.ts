import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Get('summary')
  getSummary() {
    return this.inventoryService.getSummary();
  }

  @Get('alerts')
  getAlerts() {
    return this.inventoryService.getAlerts();
  }

  @Get()
  findAll() {
    return this.inventoryService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.inventoryService.create(body);
  }

  @Get('products')
  getProducts() {
    return this.inventoryService.getProducts();
  }

  @Post('products')
  createProduct(@Body() body: any) {
    return this.inventoryService.createProduct(body);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.inventoryService.updateProduct(+id, body);
  }

  @Delete('products/:id')
  removeProduct(@Param('id') id: string) {
    return this.inventoryService.removeProduct(+id);
  }

  @Get('movements')
  getMovements() {
    return this.inventoryService.getMovements();
  }

  @Post('movements')
  createMovement(@Body() body: any) {
    return this.inventoryService.createMovement(body);
  }

  @Get('stock-takes')
  getStockTakes() {
    return this.inventoryService.getStockTakes();
  }

  @Post('stock-takes')
  async createStockTake(@Body() body: { note?: string; targetLocations?: string[] }) {
    return this.inventoryService.createStockTake(body.note, body.targetLocations);
  }

  @Post('stock-takes/:id/submit')
  submitStockTake(@Param('id') id: string, @Body() body: { items: any[] }) {
    return this.inventoryService.submitStockTake(+id, body.items);
  }
}
