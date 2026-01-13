import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Get('categories')
    getCategories() {
        return this.financeService.getCategories();
    }

    @Get('transactions')
    getTransactions() {
        return this.financeService.getTransactions();
    }

    @Post('transactions')
    createTransaction(@Body() body: any) {
        return this.financeService.createTransaction(body);
    }

    @Delete('transactions/:id')
    deleteTransaction(@Param('id') id: string) {
        return this.financeService.deleteTransaction(+id);
    }

    @Get('summary')
    getSummary() {
        return this.financeService.getSummary();
    }

    @Get('stats')
    getStats() {
        return this.financeService.getMonthlyStats();
    }
}
