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
}
