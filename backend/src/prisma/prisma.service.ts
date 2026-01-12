import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy { // extends PrismaClient
    async onModuleInit() {
        // await this.$connect();
    }

    async onModuleDestroy() {
        // await this.$disconnect();
    }
}
