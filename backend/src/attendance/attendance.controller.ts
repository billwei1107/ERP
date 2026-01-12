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
}
