import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { AttendanceType } from '@prisma/client';

@Injectable()
export class AttendanceService {
  // constructor(private prisma: PrismaService) {}
  private attendanceLog: any[] = [
    { id: 101, userId: 2, type: 'CLOCK_IN', time: new Date(new Date().setHours(8, 55)).toISOString(), date: new Date().toISOString() }, // Jane (Staff)
    { id: 102, userId: 3, type: 'CLOCK_IN', time: new Date(new Date().setHours(8, 58)).toISOString(), date: new Date().toISOString() }, // John (Staff)
    { id: 103, userId: 4, type: 'CLOCK_IN', time: new Date(new Date().setHours(9, 2)).toISOString(), date: new Date().toISOString() },  // Alice (Staff)
    { id: 104, userId: 5, type: 'CLOCK_IN', time: new Date(new Date().setHours(8, 45)).toISOString(), date: new Date().toISOString() }, // Bob (Staff)
    { id: 105, userId: 2, type: 'CLOCK_OUT', time: new Date(new Date().setHours(18, 0)).toISOString(), date: new Date().toISOString() }, // Jane (Out)
    { id: 106, userId: 100, type: 'CLOCK_IN', time: new Date(new Date().setHours(9, 0)).toISOString(), date: new Date().toISOString() }, // Admin
  ];

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

  async getMonthlyStatus(userId: number | undefined, year: number, month: number) {
    return this.attendanceLog.filter(a => {
      const date = new Date(a.date);
      const matchMonth = date.getFullYear() === year && date.getMonth() + 1 === month;
      const matchUser = userId ? a.userId === userId : true;
      return matchMonth && matchUser;
    });
  }

  async findAll() {
    return this.attendanceLog;
  }
}
