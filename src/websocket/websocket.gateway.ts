import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      this.connectedClients.set(payload.sub, client);
      
      // Join user's room for private messages
      client.join(payload.sub);
      
      console.log(`Client connected: ${payload.sub}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.connectedClients.delete(client.data.userId);
      console.log(`Client disconnected: ${client.data.userId}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; content: string; type?: string },
  ) {
    const senderId = client.data.userId;
    const { receiverId, content, type } = data;

    // Emit to receiver if online
    const receiverSocket = this.connectedClients.get(receiverId);
    if (receiverSocket) {
      receiverSocket.emit('newMessage', {
        senderId,
        content,
        type,
        timestamp: new Date(),
      });
    }

    return { success: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; isTyping: boolean },
  ) {
    const senderId = client.data.userId;
    const { receiverId, isTyping } = data;

    // Emit to receiver if online
    const receiverSocket = this.connectedClients.get(receiverId);
    if (receiverSocket) {
      receiverSocket.emit('userTyping', {
        userId: senderId,
        isTyping,
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('readReceipt')
  async handleReadReceipt(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; senderId: string },
  ) {
    const readerId = client.data.userId;
    const { messageId, senderId } = data;

    // Emit to sender if online
    const senderSocket = this.connectedClients.get(senderId);
    if (senderSocket) {
      senderSocket.emit('messageRead', {
        messageId,
        readBy: readerId,
      });
    }
  }

  // Method to send notifications to specific users
  sendNotification(userId: string, notification: any) {
    const userSocket = this.connectedClients.get(userId);
    if (userSocket) {
      userSocket.emit('notification', notification);
    }
  }

  // Method to broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
} 