import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Map to store userId -> socketId
    private connectedUsers = new Map<number, string>();

    constructor(private readonly chatService: ChatService) { }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
        const userId = client.handshake.query.userId;
        if (userId) {
            this.connectedUsers.set(Number(userId), client.id);
            console.log(`User ${userId} registered with socket ${client.id}`);
            // Broadcast user status update?
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        // Remove user
        for (const [userId, socketId] of this.connectedUsers.entries()) {
            if (socketId === client.id) {
                this.connectedUsers.delete(userId);
                break;
            }
        }
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @MessageBody() payload: { senderId: number; receiverId: number; content: string },
        @ConnectedSocket() client: Socket,
    ) {
        console.log('Received message:', payload);

        // Save to DB
        const savedMessage = await this.chatService.saveMessage(
            payload.senderId,
            payload.receiverId,
            payload.content,
        );

        // Emit to receiver if online
        const receiverSocketId = this.connectedUsers.get(payload.receiverId);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('receiveMessage', savedMessage);
        }

        // Also emit back to sender (confirm saved) or just let frontend handle optimistic UI?
        // Usually sender adds optimally, but receiving the official object is good.
        // client.emit('receiveMessage', savedMessage); // Optional if frontend needs it

        return savedMessage;
    }
}
