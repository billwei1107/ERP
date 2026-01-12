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
}
