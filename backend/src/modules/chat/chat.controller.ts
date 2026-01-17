import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
// import { JwtAuthGuard } from '../../auth/jwt-auth.guard'; // Assuming we have auth

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('history/:userId/:otherUserId')
    async getHistory(
        @Param('userId') userId: string,
        @Param('otherUserId') otherUserId: string
    ) {
        return this.chatService.getMessages(Number(userId), Number(otherUserId));
    }

    @Get('users/:userId')
    async getChatUsers(@Param('userId') userId: string) {
        return this.chatService.getChatListWithUsers(Number(userId));
    }

    @Get('unread/:userId')
    async getTotalUnread(@Param('userId') userId: string) {
        const count = await this.chatService.getTotalUnreadCount(Number(userId));
        return { count };
    }

    // Using POST for action
    @Get('read/:myId/:otherUserId') // Actually POST is better, but easy to use GET for now or use @Body
    async markAsReadGet(@Param('myId') myId: string, @Param('otherUserId') otherUserId: string) {
        return this.chatService.markMessagesAsRead(Number(myId), Number(otherUserId));
    }

    // Better REST approach: PATCH /chat/conversations/:myId/:otherId/read
    // or POST /chat/read

}
