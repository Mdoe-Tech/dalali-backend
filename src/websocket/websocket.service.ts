import { Injectable } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketService {
  constructor(private readonly websocketGateway: WebsocketGateway) {}

  // Send notification to a specific user
  sendNotification(userId: string, notification: any) {
    this.websocketGateway.sendNotification(userId, notification);
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.websocketGateway.broadcast(event, data);
  }

  // Send message to a specific user
  sendMessage(senderId: string, receiverId: string, content: string, type?: string) {
    this.websocketGateway.server.to(receiverId).emit('newMessage', {
      senderId,
      content,
      type,
      timestamp: new Date(),
    });
  }

  // Send typing indicator
  sendTypingIndicator(userId: string, receiverId: string, isTyping: boolean) {
    this.websocketGateway.server.to(receiverId).emit('userTyping', {
      userId,
      isTyping,
    });
  }

  // Send read receipt
  sendReadReceipt(messageId: string, readerId: string, senderId: string) {
    this.websocketGateway.server.to(senderId).emit('messageRead', {
      messageId,
      readBy: readerId,
    });
  }
} 