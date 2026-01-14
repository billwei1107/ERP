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
        try {
            console.log(`Fetching history for ${userId} and ${otherUserId}`);
            return await this.chatService.getMessages(Number(userId), Number(otherUserId));
        } catch (error) {
            console.error('Failed to fetch history:', error);
            throw error;
        }
    }
}
