import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async saveMessage(senderId: number, receiverId: number, content: string) {
        return this.prisma.message.create({
            data: {
                senderId,
                receiverId,
                content,
            },
            include: {
                sender: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    async getMessages(userId1: number, userId2: number) {
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 },
                ],
            },
            orderBy: {
                createdAt: 'asc',
            },
            include: {
                sender: {
                    select: { id: true, name: true },
                },
            },
        });
    }

    async getUserConversations(userId: number) {
        // This is a simplified version. For scalability, we might want a separate Conversation model.
        // Here we just find all unique users communicated with.
        const sent = await this.prisma.message.findMany({
            where: { senderId: userId },
            select: { receiverId: true },
            distinct: ['receiverId'],
        });

        const received = await this.prisma.message.findMany({
            where: { receiverId: userId },
            select: { senderId: true },
            distinct: ['senderId'],
        });

        const ids = new Set([
            ...sent.map(m => m.receiverId),
            ...received.map(m => m.senderId),
        ]);

        return Array.from(ids);
    }
}
