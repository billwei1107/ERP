import { Controller, Get, Post, Body, Delete, Param, Res, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
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

    @Get('export')
    async export(@Res() res: Response, @Query('format') format: 'xlsx' | 'csv' = 'xlsx') {
        const buffer = await this.financeService.exportTransactions(format);
        res.set({
            'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="transactions.${format}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async import(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.financeService.importTransactions(file.buffer);
    }
}
