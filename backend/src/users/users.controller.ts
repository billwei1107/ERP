import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('auth/login')
  login(@Body() body: { account: string; password: string }) {
    return this.usersService.login(body.account, body.password);
  }

  @Get('users')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('users/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch('users/:id')
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Post('users')
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Delete('users/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
