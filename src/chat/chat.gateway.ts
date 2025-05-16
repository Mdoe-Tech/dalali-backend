import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private connectedClients: Map<string, Socket> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      this.connectedClients.set(userId, client);
      client.join(userId);
      this.logger.log(`Client connected: ${userId}`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socket] of this.connectedClients.entries()) {
      if (socket === client) {
        this.connectedClients.delete(userId);
        this.logger.log(`Client disconnected: ${userId}`);
        break;
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: { 
    recipientId: string;
    message: string;
    type: 'text' | 'image' | 'file';
    metadata?: any;
  }) {
    try {
      const token = client.handshake.auth.token;
      const { sub: senderId } = await this.jwtService.verifyAsync(token);

      const message = {
        senderId,
        recipientId: payload.recipientId,
        message: payload.message,
        type: payload.type,
        metadata: payload.metadata,
        timestamp: new Date(),
      };

      // Send to recipient if online
      this.server.to(payload.recipientId).emit('newMessage', message);
      
      // Send acknowledgment to sender
      client.emit('messageSent', { ...message, status: 'sent' });

      return message;
    } catch (error) {
      this.logger.error('Message error:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(client: Socket, payload: { recipientId: string; isTyping: boolean }) {
    try {
      const token = client.handshake.auth.token;
      const { sub: senderId } = await this.jwtService.verifyAsync(token);

      this.server.to(payload.recipientId).emit('userTyping', {
        userId: senderId,
        isTyping: payload.isTyping,
      });
    } catch (error) {
      this.logger.error('Typing error:', error);
    }
  }

  @SubscribeMessage('readMessages')
  async handleReadMessages(client: Socket, payload: { messageIds: string[] }) {
    try {
      const token = client.handshake.auth.token;
      const { sub: userId } = await this.jwtService.verifyAsync(token);

      // Emit read status to message senders
      payload.messageIds.forEach(messageId => {
        this.server.to(messageId).emit('messagesRead', {
          messageId,
          readBy: userId,
          timestamp: new Date(),
        });
      });
    } catch (error) {
      this.logger.error('Read messages error:', error);
    }
  }
} 