import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TodosModule } from './todos/todos.module';
import { InventoryModule } from './inventory/inventory.module';
import { UsersModule } from './users/users.module';
import { FinanceModule } from './finance/finance.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [PrismaModule, AttendanceModule, TodosModule, InventoryModule, UsersModule, FinanceModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
