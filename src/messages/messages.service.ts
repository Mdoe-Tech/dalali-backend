import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message, MessageStatus, MessageType } from './entities/message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    fileData?: {
      fileUrl: string;
      fileName: string;
      fileSize: number;
      fileType: string;
    },
  ): Promise<Message> {
    const [sender, receiver] = await Promise.all([
      this.userRepository.findOne({ where: { id: senderId } }),
      this.userRepository.findOne({ where: { id: receiverId } }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }

    const message = this.messageRepository.create({
      senderId,
      receiverId,
      content,
      type,
      status: MessageStatus.SENT,
      ...fileData,
    });

    return this.messageRepository.save(message);
  }

  async getConversation(userId: string, otherUserId: string, limit = 50, before?: Date) {
    const query = this.messageRepository
      .createQueryBuilder('message')
      .where(
        '(message.senderId = :userId AND message.receiverId = :otherUserId) OR (message.senderId = :otherUserId AND message.receiverId = :userId)',
        { userId, otherUserId },
      )
      .andWhere('message.isDeleted = false')
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (before) {
      query.andWhere('message.createdAt < :before', { before });
    }

    const messages = await query.getMany();
    return messages.reverse();
  }

  async markMessagesAsDelivered(userId: string, senderId: string) {
    const messages = await this.messageRepository.find({
      where: {
        senderId,
        receiverId: userId,
        status: MessageStatus.SENT,
      },
    });

    if (messages.length > 0) {
      await this.messageRepository.update(
        { id: In(messages.map(m => m.id)) },
        { status: MessageStatus.DELIVERED },
      );
    }
  }

  async markMessageAsRead(messageId: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, receiverId: userId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.status !== MessageStatus.READ) {
      message.status = MessageStatus.READ;
      await this.messageRepository.save(message);
    }

    return message;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    return this.messageRepository.save(message);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.count({
      where: {
        receiverId: userId,
        status: MessageStatus.SENT,
        isDeleted: false,
      },
    });
  }

  async searchMessages(userId: string, query: string) {
    return this.messageRepository
      .createQueryBuilder('message')
      .where(
        '(message.senderId = :userId OR message.receiverId = :userId) AND message.content ILIKE :query AND message.isDeleted = false',
        { userId, query: `%${query}%` },
      )
      .orderBy('message.createdAt', 'DESC')
      .getMany();
  }
} 