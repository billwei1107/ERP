import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceType } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) { }

  async clockIn(userId: number) {
    const now = new Date();
    return this.prisma.attendance.create({
      data: {
        userId,
        type: AttendanceType.CLOCK_IN,
        time: now,
        date: now,
      }
    });
  }

  async clockOut(userId: number) {
    const now = new Date();
    return this.prisma.attendance.create({
      data: {
        userId,
        type: AttendanceType.CLOCK_OUT,
        time: now,
        date: now,
      }
    });
  }

  async getTodayStatus(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all records for today
    return this.prisma.attendance.findMany({
      where: {
        userId,
        time: {
          gte: today, // Greater than or equal to start of today
        }
      },
      orderBy: {
        time: 'desc'
      }
    });
  }

  async getMonthlyStatus(userId: number | undefined, year: number, month: number, page: number = 1, limit: number = 15) {
    // Construct date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const where = {
      ...(userId ? { userId } : {}), // Filter by userId only if provided
      time: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        orderBy: {
          time: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: true, // Include user details for admin view
        }
      }),
      this.prisma.attendance.count({ where })
    ]);

    return { data, total };
  }

  async findAll() {
    const records = await this.prisma.attendance.findMany({
      orderBy: {
        time: 'desc',
      },
      take: 200,
      include: {
        user: true
      }
    });

    const resultMap = new Map<string, any>();

    for (const r of records) {
      if (!r.user) continue;
      // Use locally formatted date string for grouping to avoid timezone splits if possible, 
      // but ISO string date part is consistent enough for now (UTC days).
      const dateStr = r.time.toISOString().split('T')[0];
      const key = `${r.userId}_${dateStr}`;

      if (!resultMap.has(key)) {
        resultMap.set(key, {
          user: r.user,
          date: r.time, // Keep one timestamp for sorting/display
          clockIn: null,
          clockOut: null
        });
      }

      const entry = resultMap.get(key);
      if (r.type === 'CLOCK_IN') {
        // If multiple clock-ins, this logic just takes one. 
        // Since we iterate DESC, this is the LATEST clock-in of the day.
        // Ideally we want the FIRST clock-in? 
        // For MVP, handling basic case is sufficient.
        if (!entry.clockIn || r.time < new Date(entry.clockIn)) {
          entry.clockIn = r.time;
        }
      } else if (r.type === 'CLOCK_OUT') {
        if (!entry.clockOut || r.time > new Date(entry.clockOut)) {
          entry.clockOut = r.time;
        }
      }
    }

    return Array.from(resultMap.values());
  }
}
