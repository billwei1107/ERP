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
        // Find all unique users communicated with, plus unread counts and last message
        // Prisma doesn't support complex "distinct on + order by" well in one go for message grouping without raw query.
        // Simplified approach: Get all users, and for each, find last message and unread count.
        // OR: Use raw query for performance.

        // Let's settle for a cleaner approach:
        // 1. Get List of Users (Filtered or all)
        // 2. Attach usage info.

        // Actually, user wants "Sort by notification". 
        // We can fetch "Recent Messages" grouped by other user.

        // Raw query is best for "Latest message per conversation"
        const conversations = await this.prisma.$queryRaw`
            SELECT 
                CASE WHEN "senderId" = ${userId} THEN "receiverId" ELSE "senderId" END as "otherUserId",
                MAX("createdAt") as "lastMessageTime",
                COUNT(CASE WHEN "receiverId" = ${userId} AND "isRead" = false THEN 1 END)::int as "unreadCount"
            FROM "Message"
            WHERE "senderId" = ${userId} OR "receiverId" = ${userId}
            GROUP BY "otherUserId"
            ORDER BY "lastMessageTime" DESC
        `;

        // This gives us the stats. We still need User details.
        // We can merge this with User list.
        return conversations;
    }

    async getChatListWithUsers(userId: number) {
        // 1. Get stats
        const conversations: any[] = await this.getUserConversations(userId);
        const statsMap = new Map();
        conversations.forEach(c => {
            // SQL returns lowercase keys sometimes depending on driver, but prisma raw is strict. 
            // We used "otherUserId"
            statsMap.set(c.otherUserId, c);
        });

        // 2. Get All Users (except self)
        const users = await this.prisma.user.findMany({
            where: {
                id: { not: userId }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
            }
        });

        // 3. Merge
        const result = users.map(u => {
            const stat = statsMap.get(u.id);
            return {
                ...u,
                unreadCount: stat ? Number(stat.unreadCount) : 0,
                lastMessageTime: stat ? stat.lastMessageTime : null,
            };
        });

        // 4. Sort
        // Priority: Last Message Time DESC. If null, then alphabetical.
        result.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            if (timeA !== timeB) return timeB - timeA;
            return a.name.localeCompare(b.name);
        });

        return result;
    }

    async markMessagesAsRead(myId: number, otherUserId: number) {
        return this.prisma.message.updateMany({
            where: {
                receiverId: myId,
                senderId: otherUserId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    }

    // Helper to get total unread for badge
    async getTotalUnreadCount(userId: number) {
        return this.prisma.message.count({
            where: {
                receiverId: userId,
                isRead: false,
            },
        });
    }
}
