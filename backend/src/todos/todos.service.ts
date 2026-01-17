import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) { }

  async create(userId: number, data: any) {
    return this.prisma.todo.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.todo.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.todo.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
        isCompleted: data.isCompleted,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.todo.delete({
      where: { id },
    });
  }
}
