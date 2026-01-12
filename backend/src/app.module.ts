import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TodosModule } from './todos/todos.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [PrismaModule, AttendanceModule, TodosModule, InventoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
