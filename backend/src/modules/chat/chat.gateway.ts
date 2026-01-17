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

    handleConnection(client: Socket) {
        // console.log(`Client connected: ${client.id}`);
        const userId = client.handshake.query.userId;
        if (userId) {
            const roomName = `user_${userId}`;
            client.join(roomName);
            // console.log(`User ${userId} joined room ${roomName}`);
        }
    }

    handleDisconnect(client: Socket) {
        // console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @MessageBody() payload: { senderId: number; receiverId: number; content: string },
        @ConnectedSocket() client: Socket,
    ) {
        // console.log('Received message:', payload);

        // Save to DB
        const savedMessage = await this.chatService.saveMessage(
            payload.senderId,
            payload.receiverId,
            payload.content,
        );

        // Emit to receiver room (all receiver's devices)
        this.server.to(`user_${payload.receiverId}`).emit('receiveMessage', savedMessage);

        // Emit to sender room (all sender's devices, including the one that sent it if not careful, but useful for other tabs)
        // Note: The sender client usually handles its own display optimistically, 
        // but syncing other tabs/devices of sender is good.
        this.server.to(`user_${payload.senderId}`).emit('receiveMessage', savedMessage);

        return savedMessage;
    }
}
