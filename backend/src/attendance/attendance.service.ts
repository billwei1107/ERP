import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { AttendanceType } from '@prisma/client';

@Injectable()
export class AttendanceService {
  // constructor(private prisma: PrismaService) {}
  private attendanceLog: any[] = [];

  async clockIn(userId: number) {
    const entry = {
      id: Math.floor(Math.random() * 1000),
      userId,
      type: 'CLOCK_IN',
      time: new Date(),
      date: new Date(),
    };
    this.attendanceLog.push(entry);
    return entry;
  }

  async clockOut(userId: number) {
    const entry = {
      id: Math.floor(Math.random() * 1000),
      userId,
      type: 'CLOCK_OUT',
      time: new Date(),
      date: new Date(),
    };
    this.attendanceLog.push(entry);
    return entry;
  }

  async getTodayStatus(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.attendanceLog.filter(a => a.userId === userId && new Date(a.date) >= today);
  }
}
