import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TodosService {
  // constructor(private prisma: PrismaService) {}
  private todos: any[] = [];

  create(userId: number, data: any) {
    const todo = {
      id: Math.floor(Math.random() * 10000),
      userId,
      title: data.title,
      description: data.description,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      isCompleted: false,
      createdAt: new Date(),
    };
    this.todos.push(todo);
    return todo;
  }

  findAll(userId: number) {
    return this.todos.filter(t => t.userId === userId);
  }

  findOne(id: number) {
    return this.todos.find(t => t.id === id);
  }

  update(id: number, data: any) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      Object.assign(todo, data);
      if (data.dueAt) todo.dueAt = new Date(data.dueAt);
    }
    return todo;
  }

  remove(id: number) {
    const index = this.todos.findIndex(t => t.id === id);
    if (index > -1) {
      return this.todos.splice(index, 1)[0];
    }
    return null;
  }
}
