import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) { }

  @Post('clock-in')
  clockIn(@Body('userId') userId: number) {
    return this.attendanceService.clockIn(Number(userId));
  }

  @Post('clock-out')
  clockOut(@Body('userId') userId: number) {
    return this.attendanceService.clockOut(Number(userId));
  }

  @Get('today')
  getToday(@Query('userId') userId: string) {
    return this.attendanceService.getTodayStatus(Number(userId));
  }

  @Get('all')
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get('month')
  getMonthly(
    @Query('userId') userId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '15',
  ) {
    return this.attendanceService.getMonthlyStatus(
      userId ? +userId : undefined,
      +year,
      +month,
      +page,
      +limit
    );
  }
}
