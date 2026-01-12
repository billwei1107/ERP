import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TodosService } from './todos.service';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) { }

  @Post()
  create(@Body() body: { userId: number; title: string; description?: string; dueAt?: string }) {
    return this.todosService.create(Number(body.userId), body);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.todosService.findAll(Number(userId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.todosService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todosService.remove(+id);
  }
}
